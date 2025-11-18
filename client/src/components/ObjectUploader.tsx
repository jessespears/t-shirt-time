import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const onGetUploadParametersRef = useRef(onGetUploadParameters);
  
  // Keep the refs updated with the latest callbacks
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    onGetUploadParametersRef.current = onGetUploadParameters;
  }, [onGetUploadParameters]);
  
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          // Use the ref to always get the latest function
          return onGetUploadParametersRef.current();
        },
      })
      .on("complete", (result) => {
        // Use the ref to always get the latest callback
        onCompleteRef.current?.(result);
        setShowModal(false);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} type="button">
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl">
          <Dashboard
            uppy={uppy}
            proudlyDisplayPoweredByUppy={false}
            height={400}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
