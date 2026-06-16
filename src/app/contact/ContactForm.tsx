'use client'

import React, { useState, useRef, useCallback } from 'react'
import TurnstileWidget from '@/components/TurnstileWidget'

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-form`
  : ''

export default function ContactForm() {
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

    // Honeypot check (client-side gate — server also checks)
    if (data.get('website')) {
      // Silent fake success for bots
      setSubmitted(true)
      return
    }

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'contact',
          turnstileToken,
          honeypot: data.get('website') as string,
          submittedAt: formLoadTime.current,
          name: data.get('name') as string,
          email: data.get('email') as string,
          subject: (data.get('subject') as string) || null,
          message: data.get('message') as string,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to send your message. Please try again.')
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
      <div className="p-6 bg-green-50 border border-green-200 rounded-md text-center">
        <h2 className="text-2xl font-lora font-bold text-green-800 mb-2">Message Sent!</h2>
        <p className="text-green-700">Thank you for contacting us. We will get back to you as soon as possible.</p>
        <button
          onClick={() => {
            setSubmitted(false)
            setTurnstileToken(null)
            formLoadTime.current = Date.now()
          }}
          className="mt-4 w-full bg-[#861D1D] text-white font-bold py-3 px-4 rounded-md hover:bg-[#F4B34C] transition-colors duration-300"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
      )}

      {/* Honeypot field — hidden from humans via CSS, bots will fill it */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <label htmlFor="website">Website (leave blank)</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-lg font-semibold mb-1">Name (required)</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4B34C]"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-lg font-semibold mb-1">Email (required)</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4B34C]"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block text-lg font-semibold mb-1">Message Subject</label>
        <input
          type="text"
          id="subject"
          name="subject"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4B34C]"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-lg font-semibold mb-1">Enter your Message (required)</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4B34C]"
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

      <button
        type="submit"
        disabled={submitting || !turnstileToken}
        className="w-full bg-[#861D1D] text-white font-bold py-3 px-4 rounded-md hover:bg-[#F4B34C] transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
