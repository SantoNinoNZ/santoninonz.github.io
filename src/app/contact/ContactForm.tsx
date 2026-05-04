'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabase) {
      setError('Service unavailable. Please try again later.')
      return
    }

    setSubmitting(true)
    setError('')

    const form = e.currentTarget
    const data = new FormData(form)

    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: data.get('name') as string,
        email: data.get('email') as string,
        subject: (data.get('subject') as string) || null,
        message: data.get('message') as string,
      })

    setSubmitting(false)

    if (insertError) {
      setError('Failed to send your message. Please try again.')
      return
    }

    setSubmitted(true)
    form.reset()
  }

  if (submitted) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-md text-center">
        <h2 className="text-2xl font-lora font-bold text-green-800 mb-2">Message Sent!</h2>
        <p className="text-green-700">Thank you for contacting us. We will get back to you as soon as possible.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 w-full bg-[#861D1D] text-white font-bold py-3 px-4 rounded-md hover:bg-[#F4B34C] transition-colors duration-300"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
      )}
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
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#861D1D] text-white font-bold py-3 px-4 rounded-md hover:bg-[#F4B34C] transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
