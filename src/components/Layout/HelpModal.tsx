import { clsx } from 'clsx';
import {
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  ExternalLink,
  GitBranch,
  Info,
  Layers,
  MapPin,
  MessageSquare,
  Truck,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

import { Modal } from '@/components/shared/Modal';

type HelpTab = 'about' | 'quickstart' | 'docs';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AboutTab() {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-oracle-red/10 to-nvidia-green/10 rounded-xl border border-dark-border">
        <h3 className="text-lg font-semibold text-white mb-2">Route Optimizer Dashboard</h3>
        <p className="text-sm text-gray-300">
          Enterprise-grade Vehicle Routing Problem (VRP) solver powered by NVIDIA cuOPT running on Oracle Cloud
          Infrastructure (OCI). This dashboard provides real-time route optimization with traffic-aware routing,
          weather integration, and AI-powered insights.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Platform Statistics</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-dark-bg rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-oracle-red">23</div>
            <div className="text-xs text-gray-400">Components</div>
          </div>
          <div className="bg-dark-bg rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-nvidia-green">GPU</div>
            <div className="text-xs text-gray-400">Accelerated</div>
          </div>
          <div className="bg-dark-bg rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-oci-blue">2</div>
            <div className="text-xs text-gray-400">Map Providers</div>
          </div>
          <div className="bg-dark-bg rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">Real-time</div>
            <div className="text-xs text-gray-400">Traffic + Weather</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Data Flow Architecture</h4>
        <div className="bg-dark-bg rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            {[
              { icon: <Database className="w-6 h-6 text-oci-blue" />, bg: 'bg-oci-blue/20', label: 'Input Data', sub: 'CSV/JSON' },
              { icon: <Layers className="w-6 h-6 text-oracle-red" />, bg: 'bg-oracle-red/20', label: 'InputPanel', sub: 'Config' },
              { icon: <Cpu className="w-6 h-6 text-nvidia-green" />, bg: 'bg-nvidia-green/20', label: 'cuOPT NIM', sub: 'GPU Solver' },
              { icon: <MapPin className="w-6 h-6 text-green-400" />, bg: 'bg-green-500/20', label: 'RouteMap', sub: 'Visualization' },
              { icon: <Truck className="w-6 h-6 text-purple-400" />, bg: 'bg-purple-500/20', label: 'ResultsPanel', sub: 'Routes' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-lg ${step.bg} flex items-center justify-center`}>
                    {step.icon}
                  </div>
                  <span className="text-gray-400">{step.label}</span>
                  <span className="text-xs text-gray-500">{step.sub}</span>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-5 h-5 text-gray-600" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Component Architecture</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-dark-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Box className="w-4 h-4 text-oracle-red" />
              <span className="font-medium text-white">Dashboard Components</span>
            </div>
            <ul className="space-y-1 text-gray-400 text-xs">
              {['Dashboard.tsx - Main container', 'InputPanel.tsx - Stops & fleet config', 'ResultsPanel.tsx - Route details'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-dark-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="font-medium text-white">Map Components</span>
            </div>
            <ul className="space-y-1 text-gray-400 text-xs">
              {['GoogleRouteMap.tsx - Traffic & Directions', 'RouteMap.tsx - Leaflet/OSM fallback', 'Weather integration overlay'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-dark-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-oci-blue" />
              <span className="font-medium text-white">AI Chat Components</span>
            </div>
            <ul className="space-y-1 text-gray-400 text-xs">
              {['ChatInterface.tsx - NLP interface', 'ChatMessage.tsx - Message rendering', 'ChatInput.tsx - User input'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-dark-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-white">Shared UI Components</span>
            </div>
            <ul className="space-y-1 text-gray-400 text-xs">
              {['Card, Button, Modal, Toast', 'Input, Select, Slider, Toggle', 'Badge, Skeleton, MetricCard'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Technology Stack</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'React 18', color: 'bg-blue-500/20 text-blue-400' },
            { label: 'TypeScript', color: 'bg-blue-600/20 text-blue-300' },
            { label: 'Vite', color: 'bg-purple-500/20 text-purple-400' },
            { label: 'Tailwind CSS', color: 'bg-cyan-500/20 text-cyan-400' },
            { label: 'Zustand', color: 'bg-yellow-500/20 text-yellow-400' },
            { label: 'Leaflet', color: 'bg-green-500/20 text-green-400' },
            { label: 'Google Maps API', color: 'bg-red-500/20 text-red-400' },
            { label: 'NVIDIA cuOPT', color: 'bg-nvidia-green/20 text-nvidia-green' },
            { label: 'OCI GenAI', color: 'bg-oracle-red/20 text-oracle-red' },
          ].map(({ label, color }) => (
            <span key={label} className={`px-3 py-1.5 ${color} rounded-full text-xs font-medium`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickStartTab() {
  const steps = [
    {
      title: 'Load Stops',
      desc: 'Use "Load Benchmark Scenario" or upload a CSV file with lat, lng, demand columns. Supports EV charging stations and custom locations.',
    },
    {
      title: 'Configure Fleet',
      desc: 'Set number of vehicles, capacity per vehicle, and enable optional features like home-start mode or parallel processing.',
    },
    {
      title: 'Run Optimization',
      desc: 'Click "Run Optimization" for single-cluster solving, or "Run Parallel" to split stops into geographic clusters for faster processing.',
    },
    {
      title: 'Review Results',
      desc: 'View optimized routes on the map with traffic overlay. Check weather impact, estimated times, and vehicle assignments in the results panel.',
    },
  ];

  const shortcuts = [
    { label: 'Toggle Sidebar', key: 'Ctrl + B' },
    { label: 'Switch Mode', key: 'Ctrl + M' },
    { label: 'Run Optimization', key: 'Ctrl + Enter' },
    { label: 'Reset', key: 'Ctrl + R' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Optimization Workflow</h4>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4 p-3 bg-dark-bg rounded-lg">
              <div className="w-8 h-8 rounded-full bg-oracle-red flex items-center justify-center text-white font-bold shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="font-medium text-white">{step.title}</div>
                <div className="text-sm text-gray-400">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {shortcuts.map(({ label, key }) => (
            <div key={label} className="flex justify-between py-2 px-3 bg-dark-bg rounded-lg">
              <span className="text-gray-400">{label}</span>
              <kbd className="px-2 py-0.5 bg-dark-card rounded text-xs">{key}</kbd>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">Map Features</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-dark-bg rounded-lg">
            <div className="font-medium text-white mb-1">Google Maps</div>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>- Real-time traffic layer</li>
              <li>- Directions API routing</li>
              <li>- Weather-adjusted ETAs</li>
              <li>- Multiple map styles</li>
            </ul>
          </div>
          <div className="p-3 bg-dark-bg rounded-lg">
            <div className="font-medium text-white mb-1">Leaflet (OSM)</div>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>- Free, no API key needed</li>
              <li>- Dark/Light themes</li>
              <li>- Route polylines</li>
              <li>- Stop markers with info</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocsTab() {
  const apiEndpoints = [
    { label: 'cuOPT Solver', value: 'POST /cuopt/solve' },
    { label: 'Weather Data', value: 'GET /weather/:lat/:lng' },
    { label: 'GenAI Chat', value: 'POST /genai/chat' },
  ];

  const docLinks = [
    {
      href: 'https://docs.oracle.com/en-us/iaas/Content/home.htm',
      icon: <Cloud className="w-4 h-4 text-oracle-red" />,
      label: 'Oracle Cloud Infrastructure',
      hoverColor: 'group-hover:text-oracle-red',
    },
    {
      href: 'https://docs.oracle.com/en-us/iaas/Content/generative-ai/home.htm',
      icon: <MessageSquare className="w-4 h-4 text-oci-blue" />,
      label: 'OCI Generative AI',
      hoverColor: 'group-hover:text-oci-blue',
    },
    {
      href: 'https://docs.nvidia.com/cuopt/',
      icon: <Cpu className="w-4 h-4 text-nvidia-green" />,
      label: 'NVIDIA cuOPT Documentation',
      hoverColor: 'group-hover:text-nvidia-green',
    },
    {
      href: 'https://developers.google.com/maps/documentation',
      icon: <MapPin className="w-4 h-4 text-red-400" />,
      label: 'Google Maps Platform',
      hoverColor: 'group-hover:text-red-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">API Endpoints</h4>
        <div className="space-y-2 text-sm">
          {apiEndpoints.map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 px-3 bg-dark-bg rounded-lg">
              <span className="text-gray-400">{label}</span>
              <span className="text-gray-300 font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">External Documentation</h4>
        <div className="space-y-2">
          {docLinks.map(({ href, icon, label, hoverColor }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-2 px-3 bg-dark-bg rounded-lg hover:bg-dark-hover transition-colors group"
            >
              <div className="flex items-center gap-2">
                {icon}
                <span className="text-gray-300 group-hover:text-white">{label}</span>
              </div>
              <ExternalLink className={`w-4 h-4 text-gray-500 ${hoverColor}`} />
            </a>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gradient-to-r from-oracle-red/10 to-oci-blue/10 rounded-xl border border-dark-border">
        <div className="font-medium text-white mb-2">Need Help?</div>
        <p className="text-sm text-gray-400">
          For technical support, feature requests, or bug reports, contact the Oracle AI CoE team.
        </p>
      </div>
    </div>
  );
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>('about');

  const tabs: Array<{ id: HelpTab; icon: React.ReactNode; label: string }> = [
    { id: 'about', icon: <Info className="w-4 h-4" />, label: 'About' },
    { id: 'quickstart', icon: <Zap className="w-4 h-4" />, label: 'Quick Start' },
    { id: 'docs', icon: <BookOpen className="w-4 h-4" />, label: 'Documentation' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Route Optimizer" size="xl">
      <div className="space-y-4">
        <div className="flex border-b border-dark-border">
          {tabs.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2',
                activeTab === id
                  ? 'text-oracle-red border-b-2 border-oracle-red'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'about' && <AboutTab />}
          {activeTab === 'quickstart' && <QuickStartTab />}
          {activeTab === 'docs' && <DocsTab />}
        </div>

        <div className="pt-4 border-t border-dark-border text-center text-xs text-gray-500">
          OCI Route Optimizer v1.0.0 | NVIDIA cuOPT NIM | Oracle Cloud Infrastructure
        </div>
      </div>
    </Modal>
  );
}
