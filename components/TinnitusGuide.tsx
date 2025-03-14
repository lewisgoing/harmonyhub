import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Headphones, 
  HelpCircle, 
  X, 
  Volume2, 
  Sliders,
  Music,
  BookOpen,
  ExternalLink,
  Info
} from 'lucide-react';

export const TinnitusGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 shadow-sm"
      >
        <Headphones className="h-3 w-3" />
        Tinnitus Guide
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Headphones className="h-5 w-5 text-purple-600" />
              Tinnitus Support Guide
            </DialogTitle>
            <DialogDescription>
              Learn how to use our tools to help manage your tinnitus while listening to music
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="tips">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="tips" className="text-xs">Quick Tips</TabsTrigger>
              <TabsTrigger value="presets" className="text-xs">Presets Guide</TabsTrigger>
              <TabsTrigger value="science" className="text-xs">How It Works</TabsTrigger>
              <TabsTrigger value="resources" className="text-xs">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tips" className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg space-y-3">
                <h3 className="font-medium text-purple-800 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Using This App For Tinnitus
                </h3>
                
                <div className="space-y-2">
                  <p className="text-sm text-purple-900">
                    Our app offers several strategies to help manage tinnitus while enjoying music:
                  </p>
                  
                  <ul className="text-sm space-y-2.5 list-none pl-0">
                    <li className="flex gap-2 items-start">
                      <div className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <span className="font-medium block">Try our pre-made tinnitus presets</span>
                        <span className="text-xs text-purple-700">Start with "Notch Filter" or "Gentle Relief" presets in the Standard tab</span>
                      </div>
                    </li>
                    
                    <li className="flex gap-2 items-start">
                      <div className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <span className="font-medium block">Create a personalized preset</span>
                        <span className="text-xs text-purple-700">Use the "Calibrate for Tinnitus" button to find your exact frequency</span>
                      </div>
                    </li>
                    
                    <li className="flex gap-2 items-start">
                      <div className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <span className="font-medium block">Try Split Ear Mode</span>
                        <span className="text-xs text-purple-700">If your tinnitus affects one ear more than the other</span>
                      </div>
                    </li>
                    
                    <li className="flex gap-2 items-start">
                      <div className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                      <div>
                        <span className="font-medium block">Fine-tune with the EQ visualizer</span>
                        <span className="text-xs text-purple-700">Drag points to adjust frequencies and gains</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-md space-y-1">
                  <h3 className="font-medium text-sm text-blue-800">For immediate help:</h3>
                  <ul className="text-sm space-y-1 list-disc pl-4 text-blue-700">
                    <li>Listen at moderate volumes</li>
                    <li>Use the calibration wizard to create a personalized preset</li>
                    <li>Try different presets to find what works best</li>
                    <li>Be patient - relief may take time</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-amber-50 rounded-md space-y-1">
                  <h3 className="font-medium text-sm text-amber-800">Important notes:</h3>
                  <ul className="text-sm space-y-1 list-disc pl-4 text-amber-700">
                    <li>This app complements but doesn't replace medical treatment</li>
                    <li>Take regular breaks from listening</li>
                    <li>Consult a healthcare professional about your tinnitus</li>
                    <li>Results vary by individual</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="presets" className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 border-b">
                    <h3 className="font-medium">Available Presets & What They Do</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm text-blue-700">Notch Filter</h4>
                      <p className="text-xs">Creates a targeted reduction at frequencies where tinnitus commonly occurs (3-8kHz). Helps reduce the impact of tinnitus while maintaining overall sound quality.</p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm text-green-700">Speech Clarity</h4>
                      <p className="text-xs">Enhances frequencies important for speech understanding (500Hz-4kHz). Helpful for those with high-frequency hearing loss alongside tinnitus.</p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm text-purple-700">Gentle Relief</h4>
                      <p className="text-xs">Combines mild bass enhancement with high-frequency reduction. Creates a warm sound profile that can provide relief from sharp tinnitus sounds.</p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm text-red-700">Masking</h4>
                      <p className="text-xs">Boosts specific frequency ranges to help mask the perception of tinnitus. Uses a gentle noise curve that helps distract from tinnitus sounds.</p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm text-gray-700">Flat (Reference)</h4>
                      <p className="text-xs">No EQ applied. Use this to compare and understand how other presets affect your listening experience.</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-md">
                  <h3 className="font-medium text-sm text-green-800">Calibrated Presets</h3>
                  <p className="text-xs mt-1 text-green-700">
                    The most effective option is to create your own custom preset with the Calibration Wizard.
                    This will appear in the "Tinnitus" tab after creation and is specifically designed for your
                    unique tinnitus frequency.
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-md">
                  <h3 className="font-medium text-sm flex items-center gap-1 text-blue-800">
                    <Info className="h-3 w-3" />
                    Usage Tips
                  </h3>
                  <ul className="text-xs mt-1 space-y-1 list-disc pl-4 text-blue-700">
                    <li>Try different presets - effectiveness varies by individual</li>
                    <li>For persistent tinnitus in a specific ear, use Split Ear Mode</li>
                    <li>Save customized versions of presets after making adjustments</li>
                    <li>Presets in the Tinnitus tab are created through calibration</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="science" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-800">The Science Behind Sound Therapy</h3>
                  
                  <p className="text-sm text-gray-700">
                    Tinnitus management through sound is based on several scientific principles:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 rounded-md">
                      <h4 className="text-sm font-medium text-blue-800">Notch Therapy</h4>
                      <p className="text-xs mt-1 text-blue-700">
                        Research shows that reducing sound energy at your tinnitus frequency can help decrease neural hyperactivity.
                        This approach, often called "notched sound therapy," may reduce tinnitus perception over time.
                        <span className="block mt-1 italic">
                          Source: Okamoto et al. (2010), PNAS: "Listening to tailor-made notched music reduces tinnitus loudness"
                        </span>
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-md">
                      <h4 className="text-sm font-medium text-green-800">Masking & Distraction</h4>
                      <p className="text-xs mt-1 text-green-700">
                        Adding pleasant sounds can partially or completely mask tinnitus and redirect attention away from the tinnitus sound.
                        This is the principle behind sound enrichment therapies.
                        <span className="block mt-1 italic">
                          Source: Hobson et al. (2012), Cochrane Database: "Sound therapy for tinnitus"
                        </span>
                      </p>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-md">
                      <h4 className="text-sm font-medium text-purple-800">Hearing Loss Compensation</h4>
                      <p className="text-xs mt-1 text-purple-700">
                        Tinnitus often occurs with hearing loss. Amplifying frequencies where hearing loss exists can improve overall hearing and reduce tinnitus perception.
                        <span className="block mt-1 italic">
                          Source: Searchfield et al. (2010), Int J Audiol: "Hearing aids as an adjunct to counseling"
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium text-gray-800 mb-2">How Our Calibration Works</h3>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    Our calibration process uses a structured approach:
                  </p>
                  
                  <ol className="text-sm space-y-2 list-decimal pl-5 text-gray-700">
                    <li>
                      <span className="font-medium">Frequency Matching:</span>
                      <span className="text-xs block ml-1 mt-0.5">
                        Identifies your specific tinnitus frequency through tone comparison
                      </span>
                    </li>
                    <li>
                      <span className="font-medium">Notch Creation:</span>
                      <span className="text-xs block ml-1 mt-0.5">
                        Creates a precise reduction (notch) at that frequency
                      </span>
                    </li>
                    <li>
                      <span className="font-medium">Width & Depth Adjustment:</span>
                      <span className="text-xs block ml-1 mt-0.5">
                        Customizes how wide and deep the notch should be
                      </span>
                    </li>
                    <li>
                      <span className="font-medium">EQ Creation:</span>
                      <span className="text-xs block ml-1 mt-0.5">
                        Generates a full EQ curve based on your tinnitus profile
                      </span>
                    </li>
                  </ol>
                  
                  <p className="text-xs mt-3 text-gray-600 italic">
                    This approach combines elements from proven sound therapy techniques while remaining accessible for everyday music listening.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <h3 className="font-medium text-gray-800">Additional Resources</h3>
                
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Educational Resources
                    </h4>
                    <ul className="text-xs mt-2 space-y-2 list-none pl-0">
                      <li className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <a 
                          href="https://www.ata.org/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          American Tinnitus Association
                        </a>
                      </li>
                      <li className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <a 
                          href="https://www.tinnitus.org.uk/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          British Tinnitus Association
                        </a>
                      </li>
                      <li className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <a 
                          href="https://www.nidcd.nih.gov/health/tinnitus" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          NIH: National Institute on Deafness and Other Communication Disorders
                        </a>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-md">
                    <h4 className="text-sm font-medium text-purple-800 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Research Article
                    </h4>
                    <ul className="text-xs mt-2 space-y-2 list-none pl-0">
                      <li className="flex items-start gap-1">
                        <ExternalLink className="h-3 w-3 text-purple-500 flex-shrink-0 mt-0.5" />
                        <a 
                          href="https://www.pnas.org/content/107/3/1207" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          Okamoto et al. (2010) - "Listening to tailor-made notched music reduces tinnitus loudness"
                        </a>
                      </li>

                    </ul>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-md">
                    <h4 className="text-sm font-medium text-green-800 flex items-center gap-1">
                      <Headphones className="h-3 w-3" />
                      Other Sound Therapy Options
                    </h4>
                    <ul className="text-xs mt-2 space-y-1 list-disc pl-4 text-green-700">
                      <li>White noise or nature sounds</li>
                      <li>Hearing aids with tinnitus masking features</li>
                      <li>Dedicated tinnitus management apps</li>
                      <li>Cognitive behavioral therapy with sound components</li>
                    </ul>
                    <p className="text-xs mt-2 text-green-600 italic">
                      Sound therapy is often most effective when used as part of a comprehensive approach to tinnitus management.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button 
              onClick={() => setIsOpen(false)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TinnitusGuide;