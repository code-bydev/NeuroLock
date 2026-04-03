'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useSecurity, type PredictionResponse } from './security-context'

interface TransferFormProps {
  onSubmit: (prediction: PredictionResponse, formData: TransferData) => void
}

export interface TransferData {
  recipient: string
  amount: string
  description: string
}

export function TransferForm({ onSubmit }: TransferFormProps) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { checkSecurity } = useSecurity()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Use the security context to check behavior
      const prediction = await checkSecurity()
      
      if (!prediction) {
        throw new Error('Failed to analyze behavior')
      }
      
      onSubmit(prediction, { recipient, amount, description })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="recipient">Recipient Account</Label>
        <Input
          id="recipient"
          type="text"
          placeholder="Enter account number or email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          className="bg-secondary/50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
            className="pl-7 bg-secondary/50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          type="text"
          placeholder="What is this transfer for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-secondary/50"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button 
        type="submit" 
        disabled={isLoading || !recipient || !amount}
        className="mt-2"
      >
        {isLoading ? (
          <>
            <Spinner className="mr-2" />
            Analyzing behavior...
          </>
        ) : (
          'Transfer Money'
        )}
      </Button>
    </form>
  )
}
