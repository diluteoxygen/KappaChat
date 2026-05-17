"use client";

import { useState } from "react";
import { 
  Palette, 
  Layout, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Zap,
  Maximize,
  Eye,
  Check,
  MessageSquare,
  Type,
  Key,
  Settings,
  Link2
} from "lucide-react";
import { ChatInput } from "./ChatInput";
import { 
  useCustomization, 
  ChatStyle, 
  ThemePreset, 
  FontFamily, 
  BorderRadius
} from "@/lib/hooks/useCustomization";

// Presets
const colorPresets = ["#CA0377", "#9147ff", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const themePresets: ThemePreset[] = ["custom", "dark", "oled", "light", "creamy"];
const fontPresets: { value: FontFamily; label: string }[] = [
  { value: "geist", label: "Geist" },
  { value: "inter", label: "Inter" },
  { value: "system", label: "System" },
  { value: "mono", label: "Mono" },
];
const radiusPresets: BorderRadius[] = ["none", "small", "medium", "large"];

/**
 * Collapsible Section - lightweight, CSS-only animation
 */
function Section({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  icon: typeof Palette; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <section className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-surface-muted/50 transition-colors rounded"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-v3">{title}</span>
        </div>
        <ChevronDown 
          className={`h-3.5 w-3.5 text-text-v5 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"}`}
      >
        <div className="space-y-3 pt-1">
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * Simple Toggle Switch - no motion.div, pure CSS
 */
function Toggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button 
      onClick={onToggle}
      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
        active 
          ? "bg-accent/10 border-accent/30 text-text-v1" 
          : "bg-surface-muted border-transparent text-text-v5 hover:bg-surface-hover"
      }`}
    >
      <span className="text-[10px] font-bold uppercase">{label}</span>
      <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${active ? "bg-accent" : "bg-surface-hover"}`}>
        <div 
          className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-150 ${active ? "translate-x-3" : "translate-x-0"}`}
        />
      </div>
    </button>
  );
}

/**
 * Slider with value display
 */
function Slider({ 
  label, 
  value, 
  min, 
  max, 
  step = 1,
  unit = "",
  onChange 
}: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-text-v5 uppercase">{label}</label>
        <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-accent h-1.5 bg-surface-hover rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
}

interface CustomizationSidebarProps {
  onConnect: (videoUrl: string) => Promise<void>;
  onDisconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  onConnectTwitch?: (channelOrUrl: string) => Promise<void>;
  onDisconnectTwitch?: () => void;
  isTwitchConnected?: boolean;
  isTwitchConnecting?: boolean;
}

/**
 * Sidebar content - extracted for reuse in mobile drawer
 */
export function SidebarContent(props: CustomizationSidebarProps) {
  const { 
    accentColor,
    fontSize,
    chatStyle,
    themePreset,
    updateField, 
    maxLoadedMessages,
    focusMode,
    chatWidth,
    showAvatars,
    showTimestamps,
    showBadges,
    messageAnimations,
    fontFamily,
    borderRadius,
    apiKey
  } = useCustomization();

  return (
    <div className="px-4 py-2 space-y-1">
      {/* Connections Section */}
      <Section title="Connections" icon={Link2} defaultOpen={true}>
        <div className="scale-[0.85] -mx-5 -my-2">
          <ChatInput {...props} />
        </div>
      </Section>

      {/* Theme & Colors */}
      <Section title="Theme" icon={Palette} defaultOpen={false}>
        <div className="grid grid-cols-5 gap-1.5">
          {themePresets.map((preset) => (
            <button
              key={preset}
              onClick={() => updateField("themePreset", preset)}
              className={`px-2 py-1.5 rounded text-[9px] font-bold capitalize border transition-colors ${
                themePreset === preset 
                  ? "bg-accent/10 border-accent text-accent" 
                  : "bg-surface-muted border-transparent text-text-v5 hover:bg-surface-hover"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {colorPresets.map((color) => (
            <button
              key={color}
              onClick={() => updateField("accentColor", color)}
              className={`h-6 w-6 rounded-full transition-transform ${accentColor === color ? "scale-110 ring-2 ring-white/30" : "hover:scale-105"}`}
              style={{ backgroundColor: color }}
            >
              {accentColor === color && <Check className="h-3 w-3 text-white mx-auto" />}
            </button>
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={(e) => updateField("accentColor", e.target.value)}
            className="h-6 w-6 rounded-full overflow-hidden border border-dashed border-border cursor-pointer"
          />
        </div>
      </Section>

      {/* Typography */}
      <Section title="Text" icon={Type}>
        <div className="grid grid-cols-4 gap-1.5">
          {fontPresets.map((font) => (
            <button
              key={font.value}
              onClick={() => updateField("fontFamily", font.value)}
              className={`px-2 py-1.5 rounded text-[9px] font-bold border transition-colors ${
                fontFamily === font.value 
                  ? "bg-accent/10 border-accent text-accent" 
                  : "bg-surface-muted border-transparent text-text-v5 hover:bg-surface-hover"
              }`}
            >
              {font.label}
            </button>
          ))}
        </div>
        <Slider label="Size" value={fontSize} min={12} max={22} unit="px" onChange={(v) => updateField("fontSize", v)} />
      </Section>

      {/* Layout */}
      <Section title="Layout" icon={Layout}>
        <div className="flex gap-1.5">
          {(["comfy", "compact"] as ChatStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => updateField("chatStyle", style)}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${
                chatStyle === style 
                  ? "bg-accent/10 text-accent" 
                  : "bg-surface-muted text-text-v5 hover:bg-surface-hover"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
        
        <Slider label="Width" value={chatWidth} min={30} max={100} step={5} unit="%" onChange={(v) => updateField("chatWidth", v)} />
        
        <div className="grid grid-cols-4 gap-1.5">
          {radiusPresets.map((r) => (
            <button
              key={r}
              onClick={() => updateField("borderRadius", r)}
              className={`py-1.5 rounded text-[9px] font-bold capitalize transition-colors ${
                borderRadius === r 
                  ? "bg-accent/10 text-accent" 
                  : "bg-surface-muted text-text-v5 hover:bg-surface-hover"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </Section>

      {/* Display Toggles */}
      <Section title="Display" icon={Eye}>
        <div className="grid grid-cols-2 gap-1.5">
          <Toggle label="Avatars" active={showAvatars} onToggle={() => updateField("showAvatars", !showAvatars)} />
          <Toggle label="Time" active={showTimestamps} onToggle={() => updateField("showTimestamps", !showTimestamps)} />
          <Toggle label="Badges" active={showBadges} onToggle={() => updateField("showBadges", !showBadges)} />
          <Toggle label="Anims" active={messageAnimations} onToggle={() => updateField("messageAnimations", !messageAnimations)} />
        </div>
      </Section>

      {/* Performance */}
      <Section title="Performance" icon={Zap} defaultOpen={false}>
        <Slider 
          label="Max Messages" 
          value={maxLoadedMessages} 
          min={100} 
          max={1000} 
          step={50} 
          onChange={(v) => updateField("maxLoadedMessages", v)} 
        />
        <p className="text-[9px] text-text-v5">Lower if experiencing lag</p>
        
        <button 
          onClick={() => updateField("focusMode", !focusMode)}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
            focusMode 
              ? "bg-accent/20 border-accent/50 text-text-v1" 
              : "bg-surface-muted border-transparent text-text-v5 hover:bg-surface-hover"
          }`}
        >
          <div className="flex items-center gap-2">
            <Maximize className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold">Focus Mode</span>
          </div>
          <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${focusMode ? "bg-accent" : "bg-surface-hover"}`}>
            <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-150 ${focusMode ? "translate-x-3" : "translate-x-0"}`} />
          </div>
        </button>
      </Section>

      {/* API Key */}
      <Section title="API Key" icon={Key} defaultOpen={false}>
        <div className="relative">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => updateField("apiKey", e.target.value)}
            placeholder="YouTube API key..."
            className="w-full bg-surface-muted border border-border rounded px-2.5 py-2 text-[11px] text-text-v1 focus:border-accent/50 outline-none transition-colors"
          />
        </div>
        <p className="text-[9px] text-text-v5 leading-relaxed">
          Add your API key to unlock all channels.
        </p>
      </Section>

      {/* Footer / Links */}
      <div className="pt-6 pb-2 px-1 opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-[9px] text-text-v5 text-center leading-relaxed">
          Questions or bugs?{" "}
          <a 
            href="https://github.com/DiluteOxygen" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-text-v4 hover:text-accent transition-colors"
          >
            @DiluteOxygen
          </a>
          {" · "}
          <a 
            href="https://github.com/DiluteOxygen/yt-chat-view" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-text-v4 hover:text-accent transition-colors"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Customization Sidebar - simplified and lightweight
 */
export function CustomizationSidebar(props: CustomizationSidebarProps) {
  const { 
    sidebarOpacity,
    isSidebarCollapsed,
    updateField, 
    sidebarPosition,
  } = useCustomization();

  // Collapsed state
  if (isSidebarCollapsed) {
    return (
      <aside className={`hidden md:flex h-full flex-col items-center border-card-border bg-sidebar py-4 w-14 transition-colors ${
        sidebarPosition === 'left' ? 'border-r order-first' : 'border-l order-last'
      }`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
          <MessageSquare className="h-4 w-4 text-accent" />
        </div>
        <button 
          onClick={() => updateField("isSidebarCollapsed", false)}
          className="mt-auto p-2 rounded-lg hover:bg-surface-hover text-text-v5 hover:text-text-v1 transition-colors"
          aria-label="Expand Sidebar"
        >
          {sidebarPosition === 'left' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
    );
  }

  return (
    <aside 
      className={`hidden md:flex w-72 flex-col border-card-border bg-sidebar h-full transition-opacity ${
        sidebarPosition === 'left' ? 'border-r order-first' : 'border-l order-last'
      }`}
      style={{ opacity: sidebarOpacity / 100 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
            <Settings className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-bold text-text-v1">Customize</span>
        </div>
        <button 
          onClick={() => updateField("isSidebarCollapsed", true)}
          className="p-1.5 rounded hover:bg-surface-hover text-text-v5 hover:text-text-v1 transition-colors"
          aria-label="Collapse Sidebar"
        >
          {sidebarPosition === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <SidebarContent {...props} />
      </div>
    </aside>
  );
}
