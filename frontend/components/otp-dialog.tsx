'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ShieldAlert } from 'lucide-react'

interface OTPDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify: (otp?: string) => void
  isVerifying: boolean
}

export function OTPDialog({ open, onOpenChange, onVerify, isVerifying }: OTPDialogProps) {
  const [otp, setOtp] = useState('')

  const handleVerify = () => {
    if (otp.length === 6) {
      onVerify()
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setOtp('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isVerifying}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
              <ShieldAlert className="h-5 w-5 text-warning" />
            </div>
            <div>
              <DialogTitle>Additional Verification Required</DialogTitle>
              <DialogDescription className="mt-1">
                Your behavior pattern requires verification. Enter the 6-digit code sent to your registered device.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex justify-center py-6">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isVerifying}
            className="w-full sm:w-auto"
          >
            {isVerifying ? (
              <>
                <Spinner className="mr-2" />
                Verifying...
              </>
            ) : (
              'Verify and Complete Transfer'
            )}
          </Button>
        </DialogFooter>

        <p className="text-center text-xs text-muted-foreground">
          For demo purposes, enter any 6 digits to verify
        </p>
      </DialogContent>
    </Dialog>
  )
}
