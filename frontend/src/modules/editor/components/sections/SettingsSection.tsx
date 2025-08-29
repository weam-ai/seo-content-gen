import React, { useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Palette, Focus, Type, Brain, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import useEditor from '../../hooks/useEditor';
import { useParams } from 'react-router-dom';
import { updateArticle } from '@/lib/services/topics.service';
import { useDebounce } from '@/hooks/use-debounce';

export const SettingsSection: React.FC = () => {
  const { settings, updateSettings } = useEditor();
  const { articleId } = useParams<{ articleId: string }>();
  const debouncedSettings = useDebounce(settings, 500);
  const isFirstRender = useRef(true);
  const { setTheme: setAppTheme } = useTheme();

  useEffect(() => {
    if (!articleId) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Persist settings to the article update API
    updateArticle(articleId, { settings: debouncedSettings }).catch(() => {
      // Silently ignore errors here; UI can add toasts if desired
    });
    // Mirror theme to localStorage/theme-provider immediately
    if (
      debouncedSettings.theme === 'light' ||
      debouncedSettings.theme === 'dark'
    ) {
      setAppTheme(debouncedSettings.theme);
    }
  }, [articleId, debouncedSettings]);
  return (
    <div className="p-3 space-y-4">
      {/* Theme */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette className="h-3 w-3 text-muted-foreground" />
          <Label className="text-xs font-medium">Theme</Label>
        </div>
        <Select
          value={settings.theme}
          onValueChange={(value: 'light' | 'dark') =>
            updateSettings({ theme: value })
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              <div className="flex items-center gap-2">
                <Sun className="h-3 w-3" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="h-3 w-3" />
                Dark
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Focus Mode */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <Focus className="h-3 w-3 text-muted-foreground" />
          <Label className="text-xs font-medium">Focus Mode</Label>
        </div>
        <Switch
          checked={settings.focusMode}
          onCheckedChange={(checked) => updateSettings({ focusMode: checked })}
        />
      </div>

      {/* Typography */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="h-3 w-3 text-muted-foreground" />
          <Label className="text-xs font-medium">Typography</Label>
        </div>

        <div className="space-y-2 pl-5">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Font</Label>
            <Select
              value={settings.typography.fontFamily}
              onValueChange={(value) =>
                updateSettings({
                  typography: { ...settings.typography, fontFamily: value },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Size</Label>
              <span className="text-xs text-muted-foreground">
                {settings.typography.fontSize}px
              </span>
            </div>
            <Slider
              value={[settings.typography.fontSize]}
              onValueChange={([value]) =>
                updateSettings({
                  typography: { ...settings.typography, fontSize: value },
                })
              }
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Line Height
              </Label>
              <span className="text-xs text-muted-foreground">
                {settings.typography.lineHeight}
              </span>
            </div>
            <Slider
              value={[settings.typography.lineHeight]}
              onValueChange={([value]) =>
                updateSettings({
                  typography: { ...settings.typography, lineHeight: value },
                })
              }
              min={1.2}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Block Spacing
              </Label>
              <span className="text-xs text-muted-foreground">
                {settings.typography.blockSpacing}em
              </span>
            </div>
            <Slider
              value={[settings.typography.blockSpacing]}
              onValueChange={([value]) =>
                updateSettings({
                  typography: { ...settings.typography, blockSpacing: value },
                })
              }
              min={0}
              max={3.0}
              step={0.25}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="h-3 w-3 text-muted-foreground" />
          <Label className="text-xs font-medium">AI</Label>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Coming Soon
          </span>
        </div>

        <div className="space-y-2 pl-5">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select
              value={settings.ai.model}
              onValueChange={(value) =>
                updateSettings({
                  ai: { ...settings.ai, model: value },
                })
              }
              disabled={true}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Creativity</Label>
            <Select
              value={
                settings.ai.temperature <= 0.3
                  ? 'conservative'
                  : settings.ai.temperature <= 0.7
                  ? 'balanced'
                  : 'creative'
              }
              onValueChange={(value) => {
                const temperatureMap = {
                  conservative: 0.3,
                  balanced: 0.7,
                  creative: 1.0,
                };
                updateSettings({
                  ai: {
                    ...settings.ai,
                    temperature:
                      temperatureMap[value as keyof typeof temperatureMap],
                  },
                });
              }}
              disabled={true}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Language</Label>
            <Select
              value={settings.ai.documentLanguage}
              onValueChange={(value) =>
                updateSettings({
                  ai: { ...settings.ai, documentLanguage: value },
                })
              }
              disabled={true}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tone</Label>
            <Select
              value={settings.ai.tone}
              onValueChange={(value) =>
                updateSettings({
                  ai: { ...settings.ai, tone: value },
                })
              }
              disabled={true}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between py-1">
          <Label className="text-xs">Auto-save</Label>
          <Switch defaultChecked disabled={true} />
        </div>

        <div className="flex items-center justify-between py-1">
          <Label className="text-xs">Spell Check</Label>
          <Switch defaultChecked disabled={true} />
        </div>

        <div className="flex items-center justify-between py-1">
          <Label className="text-xs">Grammar Check</Label>
          <Switch defaultChecked disabled={true} />
        </div>
      </div>
    </div>
  );
};
