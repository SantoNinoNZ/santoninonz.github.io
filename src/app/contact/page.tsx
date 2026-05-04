import React from 'react';
import Header from "@/components/Header";
import ContactForm from './ContactForm';

const ContactPage = () => {
  return (
    <main className="relative flex min-h-screen flex-col items-center pt-24">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-screen-xl bg-white rounded-lg shadow-lg text-[#2B1E1A] font-roboto">
        <h1 className="text-4xl md:text-5xl font-lora font-bold mb-6">Contact Us</h1>

        <div className="mb-8">
          <p className="mb-2"><strong>Contact:</strong> Oscar and Miriam Batucan</p>
          <p className="mb-2"><strong>Address (Post):</strong> NZ-Filipino Devotees of Señor Sto. Niño, P.O. Box 109 282 New Market Auckland</p>
          <p className="mb-2"><strong>Address (Office):</strong> 228 Penrose Road, Mount Wellington, Auckland</p>
          <p className="mb-2"><strong>Email:</strong> <a href="mailto:santonino@xtra.co.nz" className="text-[#861D1D] hover:underline">santonino@xtra.co.nz</a></p>
          <p className="mb-2"><strong>Phone#s:</strong> 09 570 1139, 027 487 5428 or 027 570 1139</p>
        </div>

        <ContactForm />
      </div>
    </main>
  );
};

export default ContactPage;
