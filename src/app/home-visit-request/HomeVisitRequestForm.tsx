'use client'

import React, { useState, useRef, useCallback } from 'react'
import TurnstileWidget from '@/components/TurnstileWidget'

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-form`
  : ''

export default function HomeVisitRequestForm() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const formLoadTime = useRef(Date.now())
  const formRef = useRef<HTMLFormElement>(null)

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
    setError('')
  }, [])

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!EDGE_FUNCTION_URL) {
      setError('Service unavailable. Please try again later.')
      return
    }

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification.')
      return
    }

    setSubmitting(true)
    setError('')

    const form = e.currentTarget
    const data = new FormData(form)

    // Honeypot check (client-side gate)
    if (data.get('website')) {
      setSubmitted(true)
      return
    }

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'home-visit',
          turnstileToken,
          honeypot: data.get('website') as string,
          submittedAt: formLoadTime.current,
          name: data.get('name') as string,
          email: (data.get('email') as string) || null,
          contact: (data.get('contact') as string) || null,
          address: (data.get('address') as string) || null,
          requested_datetime: data.get('requestedDateTime') as string,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to submit your request. Please try again.')
        setTurnstileToken(null)
        return
      }

      setSubmitted(true)
      form.reset()
      formLoadTime.current = Date.now()
    } catch {
      setError('Network error. Please check your connection and try again.')
      setTurnstileToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-md text-center">
        <h2 className="text-2xl font-lora font-bold text-green-800 mb-2">Thank You!</h2>
        <p className="text-green-700">Your home visit request has been received. Our team will be in touch with you soon to confirm the schedule.</p>
        <button
          onClick={() => {
            setSubmitted(false)
            setTurnstileToken(null)
            formLoadTime.current = Date.now()
          }}
          className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#A78BFA] hover:bg-[#8B5CF6]"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
      )}

      {/* Honeypot field — hidden from humans, bots fill it */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <label htmlFor="visit-website">Website (leave blank)</label>
        <input
          type="text"
          id="visit-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[#2B1E1A]">Name (required)</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#2B1E1A]">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="contact" className="block text-sm font-medium text-[#2B1E1A]">Contact Information</label>
        <input
          type="text"
          id="contact"
          name="contact"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-[#2B1E1A]">Home Address</label>
        <input
          type="text"
          id="address"
          name="address"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="requestedDateTime" className="block text-sm font-medium text-[#2B1E1A]">Please enter your requested day and time for house visit (required)</label>
        <textarea
          id="requestedDateTime"
          name="requestedDateTime"
          rows={5}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Cloudflare Turnstile CAPTCHA */}
      <div>
        <TurnstileWidget
          onVerify={handleTurnstileVerify}
          onExpire={handleTurnstileExpire}
          theme="light"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={submitting || !turnstileToken}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#A78BFA] hover:bg-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
