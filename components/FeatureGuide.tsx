import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Headphones, 
  HelpCircle, 
  X, 
  Sliders,
  Split,
  Cloud,
  Music,
  Save,
  VolumeX
} from 'lucide-react';
import { useOnboardingContext } from '@/contexts/onboarding-context';

/**
 * A comprehensive feature guide that can be accessed from anywhere in the app
 */
export const FeatureGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { openOnboarding } = useOnboardingContext();
  
  const features = [
    {
      id: 'eq',
      title: 'Equalizer',
      icon: <Sliders className="h-5 w-5 text-green-600" />,
      description: 'The equalizer allows you to adjust different frequency bands to customize your listening experience.',
      content: (
        <div className="space-y-4">
          <p>The equalizer is the heart of Harmony Hub. Here's how to use it:</p>
          
          <div className="space-y-2">
            <h4 className="font-medium">Adjusting Frequencies</h4>
            <p className="text-sm text-gray-600">
              Drag the points up or down to boost or reduce specific frequencies. This lets you enhance sounds you want to hear and reduce frequencies that cause discomfort.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Q-Value Adjustment</h4>
            <p className="text-sm text-gray-600">
              Double-click any point to adjust its "Q-value" - this controls how wide or narrow the adjustment is. Higher Q values affect a narrower range of frequencies.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Presets</h4>
            <p className="text-sm text-gray-600">
              Try our built-in presets designed for different hearing needs, or create and save your own custom presets.
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm">
                  Show Me How
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Feature coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'split-ear',
      title: 'Split Ear Mode',
      icon: <Split className="h-5 w-5 text-orange-600" />,
      description: 'Configure different EQ settings for each ear, perfect for asymmetric hearing conditions.',
      content: (
        <div className="space-y-4">
          <p>Split Ear Mode allows you to configure different EQ settings for each ear:</p>
          
          <div className="space-y-2">
            <h4 className="font-medium">When to Use</h4>
            <p className="text-sm text-gray-600">
              If you experience different levels of hearing or tinnitus in each ear, Split Ear Mode can help you optimize your experience.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Balance Control</h4>
            <p className="text-sm text-gray-600">
              Adjust the balance slider to emphasize one ear over the other if needed.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Independent Presets</h4>
            <p className="text-sm text-gray-600">
              Each ear can use a different preset - for example, "Notch Filter" in your left ear and "Speech Clarity" in your right.
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm">
                  Show Me How
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Feature coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'tinnitus',
      title: 'Tinnitus Calibration',
      icon: <VolumeX className="h-5 w-5 text-purple-600" />,
      description: 'Create personalized sound profiles matched to your specific tinnitus frequency.',
      content: (
        <div className="space-y-4">
          <p>Our tinnitus calibration creates personalized relief based on your specific tinnitus frequency:</p>
          
          <div className="space-y-2">
            <h4 className="font-medium">The Science</h4>
            <p className="text-sm text-gray-600">
              Based on notched sound therapy research, our calibration creates a "notch" at your tinnitus frequency which may provide relief over time.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">The Process</h4>
            <p className="text-sm text-gray-600">
              The wizard will guide you through identifying your tinnitus frequency, then create a customized preset specifically for you.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Best Practices</h4>
            <p className="text-sm text-gray-600">
              For best results, use headphones in a quiet environment when going through the calibration process.
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm">
                  Show Me How
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Feature coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'presets',
      title: 'Presets',
      icon: <Save className="h-5 w-5 text-teal-600" />,
      description: 'Save your favorite EQ settings as custom presets or use our pre-configured options.',
      content: (
        <div className="space-y-4">
          <p>Presets make it easy to switch between different sound profiles:</p>
          
          <div className="space-y-2">
            <h4 className="font-medium">Built-in Presets</h4>
            <p className="text-sm text-gray-600">
              <strong>Flat:</strong> No equalization applied - your baseline.<br />
              <strong>Notch Filter:</strong> Reduces frequencies where tinnitus commonly occurs (3-8kHz).<br />
              <strong>Speech Clarity:</strong> Enhances frequencies important for speech (500Hz-4kHz).<br />
              <strong>Gentle Relief:</strong> Combines bass boost with high-frequency reduction.<br />
              <strong>Masking:</strong> Enhances certain frequencies to help mask tinnitus perception.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Custom Presets</h4>
            <p className="text-sm text-gray-600">
              After adjusting the EQ to your liking, click "Save" to create a custom preset that you can return to anytime.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Tinnitus Presets</h4>
            <p className="text-sm text-gray-600">
              Presets created through the calibration wizard are specially designed for your unique tinnitus frequency.
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm">
                  Show Me How
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Feature coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'cloud',
      title: 'Cloud Sync',
      icon: <Cloud className="h-5 w-5 text-blue-600" />,
      description: 'Save your settings to the cloud and access them from any device.',
      content: (
        <div className="space-y-4">
          <p>Cloud sync lets you access your settings anywhere:</p>
          
          <div className="space-y-2">
            <h4 className="font-medium">Benefits</h4>
            <p className="text-sm text-gray-600">
              Create an account to save your custom presets and settings to the cloud. Access them from any device, never lose your perfect sound profile.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Privacy</h4>
            <p className="text-sm text-gray-600">
              Your data is securely stored and only accessible to you. We never share your hearing profile or settings with third parties.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Using Without an Account</h4>
            <p className="text-sm text-gray-600">
              Harmony Hub works perfectly fine without an account - your settings will just be stored locally on your current device.
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm">
                  Show Me How
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Feature coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'music',
      title: 'Music Player',
      icon: <Music className="h-5 w-5 text-blue-600" />,
      description: 'Play music from various sources with your customized EQ settings.',
      content: (
        <div className="space-y-4">
          <p>The music player lets you enjoy sound with your custom settings:</p>
          
          <div className="space-y-2">
            <h4 className="font-medium">Music Sources</h4>
            <p className="text-sm text-gray-600">
              Listen to our built-in demo tracks, or connect to external audio sources like YouTube, SoundCloud, or direct audio files.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Controls</h4>
            <p className="text-sm text-gray-600">
              Standard play/pause, seek, and volume controls make it easy to use. The player works together with your EQ settings to enhance your listening experience.
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm">
                  Show Me How
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Feature coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="text-xs flex items-center gap-1"
      >
        <HelpCircle className="h-3 w-3" />
        Help Guide
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-purple-600" />
              Harmony Hub Guide
            </DialogTitle>
            <DialogDescription>
              Learn how to get the most out of Harmony Hub's features
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Tabs defaultValue="eq">
              <TabsList className="grid grid-cols-6 h-auto py-2">
                {features.map(feature => (
                  <TabsTrigger key={feature.id} value={feature.id} className="text-xs py-3 h-auto">
                    <div className="flex flex-col items-center gap-1">
                      {feature.icon}
                      <span>{feature.title}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {features.map(feature => (
                <TabsContent key={feature.id} value={feature.id} className="p-4 border rounded-md mt-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-1">{feature.title}</h3>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      {feature.content}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          <div className="flex justify-end mt-4">
          <Button 
  variant="outline" 
  onClick={() => {
    setIsOpen(false);
    openOnboarding();
  }}
>
  Start Full Tour
</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeatureGuide;