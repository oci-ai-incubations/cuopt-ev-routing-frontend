import { useRef, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatDebugPanel } from './ChatDebugPanel';
import { LoadingDots } from '@/components/shared/LoadingDots';
import { useChatStore, useAppStore, useOptimizationStore } from '@/store';
import { genaiClient, cuoptClient, weatherClient } from '@/api';
import type { Stop } from '@/types';
import type { WeatherRoutingImpact, AdverseConditionAssessment } from '@/types/weather';

// Helper function to generate weather summary for AI response
function generateWeatherSummary(impacts: WeatherRoutingImpact[], assessment: AdverseConditionAssessment | null): string {
  if (!assessment || impacts.length === 0) {
    return '';
  }

  const levelText: Record<string, string> = {
    none: 'Clear conditions',
    low: 'Minor weather impact',
    moderate: 'Moderate weather conditions',
    high: 'Adverse weather warning',
    severe: 'Severe weather alert',
  };

  // Count conditions
  const conditionCounts = impacts.reduce((acc, imp) => {
    const main = imp.weather.conditions[0]?.main || 'Clear';
    acc[main] = (acc[main] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conditionSummary = Object.entries(conditionCounts)
    .map(([cond, count]) => `${cond}: ${count} stops`)
    .join(', ');

  // Temperature range
  const temps = impacts.map(i => i.weather.temperature);
  const minTemp = Math.min(...temps).toFixed(0);
  const maxTemp = Math.max(...temps).toFixed(0);

  // Wind info
  const maxWind = Math.max(...impacts.map(i => i.weather.windSpeed));
  const avgWind = (impacts.reduce((s, i) => s + i.weather.windSpeed, 0) / impacts.length).toFixed(1);

  let summary = `\n\nWeather Assessment: ${levelText[assessment.level]}`;
  summary += `\nTemperature: ${minTemp}C to ${maxTemp}C`;
  summary += `\nConditions: ${conditionSummary}`;
  summary += `\nWind: avg ${avgWind} m/s, max ${maxWind.toFixed(1)} m/s`;
  summary += `\nTravel time adjustment: +${((assessment.travelTimeMultiplier - 1) * 100).toFixed(0)}%`;
  summary += `\nSafety score: ${assessment.safetyScore}/100`;

  if (assessment.recommendations.length > 0) {
    summary += `\nRecommendations: ${assessment.recommendations.slice(0, 2).join('; ')}`;
  }

  return summary;
}

export function ChatInterface() {
  const {
    messages,
    addMessage,
    addStreamingMessage,
    appendToStreamingMessage,
    finalizeStreamingMessage,
    isProcessing,
    setIsProcessing,
    isStreaming,
    debugMode,
    toggleDebugMode,
    setDebugData,
    lastCuOptRequest,
    lastCuOptResponse,
    lastGenAIPrompt,
    createConversation,
    currentConversationId,
    config,
  } = useChatStore();

  const { addToast } = useAppStore();
  const { setResult, setStops } = useOptimizationStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create conversation if needed
  useEffect(() => {
    if (!currentConversationId) {
      createConversation();
    }
  }, [currentConversationId, createConversation]);

  const handleSend = useCallback(
    async (content: string, attachedStops?: Stop[]) => {
      // Add user message with file info if attached
      const userContent = attachedStops
        ? `${content}\n\n[Attached CSV: ${attachedStops.length} stops]`
        : content;
      addMessage({ role: 'user', content: userContent });
      setIsProcessing(true);

      // Sync selected model to genaiClient
      genaiClient.setModel(config.model);

      try {
        // Step 0: Classify intent FIRST to avoid unnecessary API calls
        const intentResult = await genaiClient.classifyIntent(content);

        // Handle non-optimization intents without calling cuOPT
        if (intentResult.intent === 'greeting') {
          addMessage({
            role: 'assistant',
            content: `Hello! I'm your cuOPT AI Assistant. I can help you with:

**Route Optimization:** Tell me about your delivery or service routing needs
- "Optimize 50 deliveries with 5 vehicles in London"
- "Plan routes for 200 stops across the UK with 10 trucks"

**Questions:** Ask me about cuOPT, VRP, or route optimization
- "What is cuOPT?"
- "How does vehicle routing work?"

How can I assist you today?`,
          });
          setIsProcessing(false);
          return;
        }

        if (intentResult.intent === 'question' && intentResult.answer) {
          // Answer informational questions directly without calling solver
          addStreamingMessage();
          const words = intentResult.answer.split(' ');
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const suffix = i < words.length - 1 ? ' ' : '';
            appendToStreamingMessage(word + suffix);
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          finalizeStreamingMessage({
            model: config.model,
          });
          setIsProcessing(false);
          return;
        }

        if (intentResult.intent === 'unclear' && intentResult.confidence < 0.6) {
          addMessage({
            role: 'assistant',
            content: `I'm not quite sure what you're looking for. Here's what I can help with:

**For Route Optimization**, tell me:
- How many stops/deliveries you have
- How many vehicles are available
- Any location or time constraints

**Example:** "Optimize 100 deliveries with 8 vehicles in Manchester"

**For Information**, ask questions like:
- "What is cuOPT?"
- "How does route optimization work?"

Could you provide more details about what you need?`,
          });
          setIsProcessing(false);
          return;
        }

        // Step 1: Convert prompt to cuOPT request using GenAI
        // If stops are attached, inform GenAI about the stop count
        const promptForGenAI = attachedStops
          ? `${content} (User has uploaded ${attachedStops.length} stops from CSV file)`
          : content;
        const { request, interpretation, error, numStops: extractedNumStops, numVehicles, useParallel: genaiUseParallel, numClusters: genaiNumClusters, stops: generatedStops } =
          await genaiClient.convertPromptToCuOpt(promptForGenAI);

        // Use attached stops if available, otherwise use generated stops from genaiClient
        const numStops = attachedStops?.length || extractedNumStops;
        const stopsToUse = attachedStops || generatedStops || [];

        if (error || !request) {
          addMessage({
            role: 'assistant',
            content: `I couldn't fully understand that request. ${interpretation || error}

Could you please provide more details? For example:
- How many stops/deliveries do you have?
- How many vehicles are available?
- Are there any time constraints?`,
          });
          return;
        }

        setDebugData({ cuoptRequest: request, genaiPrompt: interpretation });

        // Use parallel processing if GenAI detected it from user prompt or if stops >= threshold
        const useParallel = genaiUseParallel || false;
        const numClusters = genaiNumClusters || (useParallel ? Math.min(Math.ceil((numStops || 500) / 500), 8) : 1);

        if (useParallel) {
          // Add message about parallel processing
          addMessage({
            role: 'assistant',
            content: `${interpretation}\n\nLarge problem detected (${numStops} stops). Using parallel processing with ${numClusters} clusters for faster optimization...`,
          });

          // Use stops from genaiClient (already generated with correct location coordinates)
          const stops = stopsToUse;

          // Fetch weather data for stops (sample first 10 for efficiency)
          let weatherSummary = '';
          try {
            const sampleStops = stops.slice(0, Math.min(10, stops.length));
            const weatherImpacts = await weatherClient.getRoutingImpact(sampleStops);

            if (weatherImpacts.length > 0) {
              // Calculate overall assessment
              const levels = ['none', 'low', 'moderate', 'high', 'severe'];
              let worstLevel = 'none';
              weatherImpacts.forEach((imp: WeatherRoutingImpact) => {
                if (levels.indexOf(imp.assessment.level) > levels.indexOf(worstLevel)) {
                  worstLevel = imp.assessment.level;
                }
              });

              const avgMultiplier = weatherImpacts.reduce((s: number, i: WeatherRoutingImpact) => s + i.assessment.travelTimeMultiplier, 0) / weatherImpacts.length;
              const avgSafety = weatherImpacts.reduce((s: number, i: WeatherRoutingImpact) => s + i.assessment.safetyScore, 0) / weatherImpacts.length;

              const overallAssessment: AdverseConditionAssessment = {
                level: worstLevel as AdverseConditionAssessment['level'],
                factors: weatherImpacts.flatMap((i: WeatherRoutingImpact) => i.assessment.factors).slice(0, 3),
                travelTimeMultiplier: avgMultiplier,
                safetyScore: avgSafety,
                recommendations: [...new Set(weatherImpacts.flatMap((i: WeatherRoutingImpact) => i.assessment.recommendations))].slice(0, 3) as string[],
              };

              weatherSummary = generateWeatherSummary(weatherImpacts, overallAssessment);
            }
          } catch (e) {
            // Weather fetch failed, continue without it
            // eslint-disable-next-line no-console
            console.log('Weather fetch failed:', e);
          }

          // Cluster the stops
          const clusters = cuoptClient.clusterStops(stops, numClusters);

          // Build payloads for each cluster
          const vehiclesPerCluster = Math.ceil((numVehicles || 10) / numClusters);
          const payloads = clusters.map((cluster) => {
            // Don't set startLat/startLng to avoid triggering home-start mode
            const vehicles = Array.from({ length: vehiclesPerCluster }, (_, i) => ({
              id: i,
              capacity: 100,
              startLat: 0,
              startLng: 0,
            }));
            return cuoptClient.buildPayload(cluster, vehicles, {
              numVehicles: vehiclesPerCluster,
              vehicleCapacity: 100,
              timeLimit: 60,
              objective: 'minimize_distance',
              enableTimeWindows: false,
              enableCapacity: true,
              parallelJobs: numClusters,
              solverMode: 'balanced',
              enableHomeStart: false, // Explicitly disable home-start for AI chat
            });
          });

          // Run parallel optimization
          const results = await cuoptClient.solveParallel(
            payloads,
            numClusters,
            () => {
              // Progress callback - clusters completed
            },
            () => {
              // Job started callback - could update UI here if needed
            }
          );

          // Merge results with unique numeric vehicle IDs
          let globalVehicleId = 0;
          const mergedVehicleData = results.flatMap((r, clusterIdx) =>
            (r?.vehicle_data || []).map((v) => ({
              ...v,
              vehicle_id: globalVehicleId++,
              cluster_id: clusterIdx,
            }))
          );

          const mergedResult = {
            status: 'SUCCESS' as const,
            num_vehicles: mergedVehicleData.length,
            solution_cost: results.reduce((sum, r) => sum + (r?.solution_cost || 0), 0),
            solve_time: Math.max(...results.map(r => r?.solve_time || 0)),
            vehicle_data: mergedVehicleData,
            clusters_used: numClusters,
            parallel_execution: true,
          };

          setDebugData({ cuoptResponse: mergedResult });

          // Sync results to Route Optimizer panel for detailed view
          setStops(stops);
          setResult(mergedResult);

          // Step 3: Convert response to natural language (pass weather context and stops for operational metrics)
          const explanation = await genaiClient.convertResponseToNaturalLanguage(
            mergedResult,
            content,
            weatherSummary || undefined,
            stops
          );

          // Stream the response word by word like ChatGPT
          let fullResponse = `${explanation}\n\nParallel Processing Complete: ${numClusters} clusters processed, ${mergedResult.num_vehicles} total vehicles, combined solve time ${mergedResult.solve_time.toFixed(2)}s`;

          // Add weather summary if available
          if (weatherSummary) {
            fullResponse += weatherSummary;
          }

          addStreamingMessage();
          const words = fullResponse.split(' ');

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const suffix = i < words.length - 1 ? ' ' : '';
            appendToStreamingMessage(word + suffix);
            await new Promise(resolve => setTimeout(resolve, 25));
          }

          finalizeStreamingMessage({
            cuoptRequest: request,
            cuoptResponse: mergedResult,
            model: config.model,
          });

          addToast({
            type: 'success',
            title: 'Parallel Optimization Complete',
            message: `Processed ${numClusters} clusters with ${mergedResult.num_vehicles} vehicles`,
          });
        } else {
          // Standard single request for smaller problems
          addMessage({
            role: 'assistant',
            content: `${interpretation}\n\nRunning optimization...`,
          });

          // Use stops from genaiClient (already generated with correct location coordinates)
          const stops = stopsToUse;

          // Fetch weather data for stops
          let weatherSummary = '';
          try {
            const sampleStops = stops.slice(0, Math.min(10, stops.length));
            const weatherImpacts = await weatherClient.getRoutingImpact(sampleStops);

            if (weatherImpacts.length > 0) {
              const levels = ['none', 'low', 'moderate', 'high', 'severe'];
              let worstLevel = 'none';
              weatherImpacts.forEach((imp: WeatherRoutingImpact) => {
                if (levels.indexOf(imp.assessment.level) > levels.indexOf(worstLevel)) {
                  worstLevel = imp.assessment.level;
                }
              });

              const avgMultiplier = weatherImpacts.reduce((s: number, i: WeatherRoutingImpact) => s + i.assessment.travelTimeMultiplier, 0) / weatherImpacts.length;
              const avgSafety = weatherImpacts.reduce((s: number, i: WeatherRoutingImpact) => s + i.assessment.safetyScore, 0) / weatherImpacts.length;

              const overallAssessment: AdverseConditionAssessment = {
                level: worstLevel as AdverseConditionAssessment['level'],
                factors: weatherImpacts.flatMap((i: WeatherRoutingImpact) => i.assessment.factors).slice(0, 3),
                travelTimeMultiplier: avgMultiplier,
                safetyScore: avgSafety,
                recommendations: [...new Set(weatherImpacts.flatMap((i: WeatherRoutingImpact) => i.assessment.recommendations))].slice(0, 3) as string[],
              };

              weatherSummary = generateWeatherSummary(weatherImpacts, overallAssessment);
            }
          } catch {
            // Weather fetch failed, continue without weather summary.
          }

          // Step 2: Call cuOPT API
          const cuoptResult = await cuoptClient.solveVRP(request);
          setDebugData({ cuoptResponse: cuoptResult });

          // Sync results to Route Optimizer panel for detailed view
          setStops(stops);
          setResult(cuoptResult);

          // Step 3: Convert response to natural language (pass weather context and stops for operational metrics)
          const explanation = await genaiClient.convertResponseToNaturalLanguage(
            cuoptResult,
            content,
            weatherSummary || undefined,
            stops
          );

          // Add weather to response
          let fullExplanation = explanation;
          if (weatherSummary) {
            fullExplanation += weatherSummary;
          }

          // Stream the response word by word like ChatGPT
          addStreamingMessage();
          const words = fullExplanation.split(' ');

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const suffix = i < words.length - 1 ? ' ' : '';
            appendToStreamingMessage(word + suffix);
            // Small delay between words for typing effect
            await new Promise(resolve => setTimeout(resolve, 25));
          }

          // Finalize with metadata
          finalizeStreamingMessage({
            cuoptRequest: request,
            cuoptResponse: cuoptResult,
            model: config.model,
          });

          addToast({
            type: 'success',
            title: 'Optimization Complete',
            message: `Found solution with ${cuoptResult.num_vehicles} vehicles`,
          });
        }
      } catch (error) {
        addMessage({
          role: 'assistant',
          content: `I encountered an error while processing your request: ${
            error instanceof Error ? error.message : 'Unknown error'
          }

Please try again or rephrase your request.`,
        });

        addToast({
          type: 'error',
          title: 'Processing Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage, setIsProcessing, setDebugData, addToast, setResult, setStops, config.model]
  );

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <ChatHeader debugMode={debugMode} onToggleDebug={toggleDebugMode} />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <ChatEmptyState onPromptClick={(prompt) => handleSend(prompt)} />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && message.id === useChatStore.getState().streamingMessageId}
                />
              ))}
              {isProcessing && !isStreaming && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#C74634]/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-[#C74634]" />
                  </div>
                  <div className="bg-dark-card border border-dark-border rounded-2xl rounded-tl-none px-4 py-3">
                    <LoadingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput onSend={handleSend} isProcessing={isProcessing} />
      </div>

      {debugMode && (
        <ChatDebugPanel
          lastGenAIPrompt={lastGenAIPrompt}
          lastCuOptRequest={lastCuOptRequest}
          lastCuOptResponse={lastCuOptResponse}
        />
      )}
    </div>
  );
}
