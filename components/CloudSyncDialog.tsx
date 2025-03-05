import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';

interface CloudSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyCloudSettings: () => void;
  onKeepLocalSettings: () => void;
  numPresets: number;
}

export function CloudSyncDialog({
  open,
  onOpenChange,
  onApplyCloudSettings,
  onKeepLocalSettings,
  numPresets
}: CloudSyncDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            Cloud Settings Available
          </DialogTitle>
          <DialogDescription>
            {numPresets > 0 ? (
              <>
                We found {numPresets} preset{numPresets > 1 ? 's' : ''} and your EQ settings in the cloud. 
                Would you like to use these settings?
              </>
            ) : (
              <>
                We found your EQ settings in the cloud. Would you like to use these settings?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-2 py-2">
          <p className="text-sm text-muted-foreground">
            Using cloud settings will replace your current local settings.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:space-x-0">
          <Button 
            variant="outline" 
            onClick={onKeepLocalSettings}
          >
            Keep Local Settings
          </Button>
          <Button 
            onClick={onApplyCloudSettings} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Use Cloud Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CloudSyncDialog;