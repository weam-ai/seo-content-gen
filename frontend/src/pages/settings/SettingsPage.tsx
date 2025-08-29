import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Palette,
  Zap,
  Eye,
  Lock,
  Trash2,
  Download,
  Upload,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const [settings, setSettings] = useState({
    // Privacy
    profileVisibility: 'team',
    dataSharing: false,
    analyticsTracking: true,

    // Preferences
    theme: 'light',
    language: 'en',
    timezone: 'PST',
    autoSave: true,

    // AI Settings
    aiAssistance: true,
    aiSuggestions: true,
    aiDataUsage: true,
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const settingSections = [
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Control your data and security preferences',
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: Palette,
      description: 'Customize your Razorcopy experience',
    },
    {
      id: 'ai',
      title: 'AI Settings',
      icon: Zap,
      description: 'Configure AI assistance and data usage',
    },
  ];

  const [activeSection, setActiveSection] = useState('privacy');

  return (
    <div className="">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button - Now in content area */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings ⚙️</h1>
          <p className="text-muted-foreground text-lg">
            Customize your Razorcopy experience to work just the way you like it
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 sticky top-8">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {settingSections.map((section) => (
                    <Button
                      key={section.id}
                      variant={
                        activeSection === section.id ? 'default' : 'ghost'
                      }
                      className={`w-full justify-start gap-3 ${
                        activeSection === section.id
                          ? 'razor-gradient text-white'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <section.icon className="h-4 w-4" />
                      {section.title}
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Notifications section removed for single-user application */}

            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Profile Visibility</Label>
                        <Select
                          value={settings.profileVisibility}
                          onValueChange={(value) =>
                            handleSettingChange('profileVisibility', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">
                              Public - Anyone can see
                            </SelectItem>
                            <SelectItem value="team">
                              Team Only - Only team members
                            </SelectItem>
                            <SelectItem value="private">
                              Private - Only you
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <Label>Data Sharing</Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Allow anonymous usage data to improve Razorcopy
                          </p>
                        </div>
                        <Switch
                          checked={settings.dataSharing}
                          onCheckedChange={(checked) =>
                            handleSettingChange('dataSharing', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Analytics Tracking</Label>
                          <p className="text-sm text-muted-foreground">
                            Help us understand how you use Razorcopy
                          </p>
                        </div>
                        <Switch
                          checked={settings.analyticsTracking}
                          onCheckedChange={(checked) =>
                            handleSettingChange('analyticsTracking', checked)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                      Security Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start hover-lift"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover-lift"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Your Data
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start hover-lift text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'preferences' && (
              <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                    App Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select
                        value={settings.theme}
                        onValueChange={(value) =>
                          handleSettingChange('theme', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light Mode ☀️</SelectItem>
                          <SelectItem value="dark">Dark Mode 🌙</SelectItem>
                          <SelectItem value="system">
                            System Default 🖥️
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select
                        value={settings.language}
                        onValueChange={(value) =>
                          handleSettingChange('language', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English 🇺🇸</SelectItem>
                          <SelectItem value="es">Español 🇪🇸</SelectItem>
                          <SelectItem value="fr">Français 🇫🇷</SelectItem>
                          <SelectItem value="de">Deutsch 🇩🇪</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) =>
                          handleSettingChange('timezone', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PST">
                            Pacific Standard Time
                          </SelectItem>
                          <SelectItem value="EST">
                            Eastern Standard Time
                          </SelectItem>
                          <SelectItem value="GMT">
                            Greenwich Mean Time
                          </SelectItem>
                          <SelectItem value="CET">
                            Central European Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Auto-Save</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically save your work
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoSave}
                        onCheckedChange={(checked) =>
                          handleSettingChange('autoSave', checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'ai' && (
              <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                    AI Assistant Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>AI Assistance</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable AI-powered writing assistance
                        </p>
                      </div>
                      <Switch
                        checked={settings.aiAssistance}
                        onCheckedChange={(checked) =>
                          handleSettingChange('aiAssistance', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Smart Suggestions</Label>
                        <p className="text-sm text-muted-foreground">
                          Get AI suggestions while writing
                        </p>
                      </div>
                      <Switch
                        checked={settings.aiSuggestions}
                        onCheckedChange={(checked) =>
                          handleSettingChange('aiSuggestions', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>AI Data Usage</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow AI to learn from your content to improve
                          suggestions
                        </p>
                      </div>
                      <Switch
                        checked={settings.aiDataUsage}
                        onCheckedChange={(checked) =>
                          handleSettingChange('aiDataUsage', checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-[hsl(var(--razor-primary))]/10 to-[hsl(var(--razor-secondary))]/10 rounded-lg border border-[hsl(var(--razor-primary))]/20">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-[hsl(var(--razor-primary))] mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          AI Usage This Month
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          You've used 89 AI assists out of your 500 monthly
                          limit
                        </p>
                        <div className="w-full bg-background rounded-full h-2">
                          <div
                            className="razor-gradient h-2 rounded-full transition-all duration-300"
                            style={{ width: '18%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <Button className="razor-gradient hover:opacity-90 hover-lift">
                <Upload className="h-4 w-4 mr-2" />
                Save All Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
