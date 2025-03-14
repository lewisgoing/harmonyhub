import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Headphones, 
  VolumeX, 
  X, 
  ExternalLink,
  Info,
  BookOpen,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TinnitusCalibrationGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartCalibration: () => void;
}

/**
 * A guide explaining the tinnitus calibration feature that appears 
 * before starting the calibration process
 */
const TinnitusCalibrationGuide: React.FC<TinnitusCalibrationGuideProps> = ({ 
  open, 
  onOpenChange,
  onStartCalibration
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    {
      title: "About Tinnitus Calibration",
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-purple-100 p-6 rounded-full">
              <Headphones className="h-12 w-12 text-purple-600" />
            </div>
          </div>
          
          <p>
            Our calibration wizard creates a personalized EQ preset that targets your
            specific tinnitus frequency, making music more enjoyable and potentially
            providing relief.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mt-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800">Based on Clinical Research</p>
                <p className="text-xs text-purple-700 mt-1">
                  This approach is based on peer-reviewed research on notched sound therapy 
                  for tinnitus management.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How It Works",
      content: (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-2">
                  <VolumeX className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs">Identify<br/>Frequency</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-3 rounded-full mb-2">
                  <Headphones className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xs">Fine-tune<br/>Settings</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-100 p-3 rounded-full mb-2">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-xs">Create<br/>Preset</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm">
              The step-by-step wizard will help you:
            </p>
            <ol className="space-y-2 text-sm pl-5 list-decimal">
              <li>Identify the frequency that most closely matches your tinnitus</li>
              <li>Fine-tune the exact frequency for precision</li>
              <li>Adjust settings like notch depth and width</li>
              <li>Create a personalized preset for ongoing relief</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: "For Best Results",
      content: (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Important Tips</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1 list-disc pl-4">
                  <li>Use headphones for the most accurate calibration</li>
                  <li>Find a quiet environment with minimal distractions</li>
                  <li>Set a comfortable volume level</li>
                  <li>Take your time with each step</li>
                  <li>You can always recalibrate later if needed</li>
                </ul>
              </div>
            </div>
          </div>
          
          <p className="text-sm">
            The calibration process typically takes 3-5 minutes. Your custom preset
            will be saved and can be accessed anytime from the "Tinnitus" tab in presets.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Results may vary by individual. For best results, use your custom preset regularly
                while listening to music or other audio content.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];
  
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Start calibration on final step
      onOpenChange(false);
      onStartCalibration();
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Animation variants
  const fadeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-purple-600" />
            Tinnitus Calibration Guide
          </DialogTitle>
          <DialogDescription>
            Learn how the calibration process works
          </DialogDescription>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className="py-4"
          >
            <h3 className="text-lg font-medium mb-4">{steps[currentStep].title}</h3>
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>
        
        <DialogFooter className="flex justify-between items-center">
          <div className="flex space-x-1">
            {Array.from({ length: steps.length }).map((_, index) => (
              <div 
                key={index}
                className={`h-1.5 rounded-full ${
                  index === currentStep 
                    ? 'w-6 bg-purple-500' 
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={goToPrevStep}>
                Back
              </Button>
            )}
            
            <Button 
              onClick={goToNextStep}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {currentStep === steps.length - 1 ? 'Start Calibration' : 'Next'}
              {currentStep !== steps.length - 1 && (
                <ChevronRight className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TinnitusCalibrationGuide;    