'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PrayerRequestForm() {
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
      .from('prayer_requests')
      .insert({
        name: data.get('name') as string,
        email: (data.get('email') as string) || null,
        contact: (data.get('contact') as string) || null,
        prayer_request: data.get('prayerRequest') as string,
      })

    setSubmitting(false)

    if (insertError) {
      setError('Failed to submit your prayer request. Please try again.')
      return
    }

    setSubmitted(true)
    form.reset()
  }

  if (submitted) {
    return (
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-md text-center">
        <h2 className="text-2xl font-lora font-bold text-green-800 mb-2">Thank You!</h2>
        <p className="text-green-700">Your prayer request has been received. We will include it in our novena masses for Señor Sto Niño.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#A78BFA] hover:bg-[#8B5CF6]"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
      )}
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
        <label htmlFor="prayerRequest" className="block text-sm font-medium text-[#2B1E1A]">Prayer Request (required)</label>
        <textarea
          id="prayerRequest"
          name="prayerRequest"
          rows={5}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#A78BFA] hover:bg-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
