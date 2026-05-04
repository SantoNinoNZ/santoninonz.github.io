import React from 'react';
import Header from "@/components/Header";
import HomeVisitRequestForm from './HomeVisitRequestForm';

const HomeVisitRequestPage = () => {
  return (
    <main className="relative flex min-h-screen flex-col items-center pt-24">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-screen-xl bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl md:text-5xl font-lora font-bold mb-4 text-[#2B1E1A] leading-tight">
          Home Visit Request
        </h1>
        <div className="prose prose-lg max-w-none text-[#2B1E1A] font-roboto">
          <p>Legend has it that the Child Jesus Senyor Santo Niño sneaks out of the basilica at night to visit sick children in their homes and heal them as they sleep. In the morning, the altar boys are dumbfounded to find the Christ Child has muddy, worn-out shoes inside his glass casing.</p>
          <p>For 24 years now, the NZ-Filipino Devotees of Senyor Sto Niño has been organizing a 2 week house to house visitation of the pilgrim Sto Niño. We encourage you to invite him to your homes. We have received stories of healing and answered prayers through heartfelt worship. The real miracle is that Sto Niño has made a way for us to communicate love for others through means of prayers, comforting our restless souls.</p>
          <p>Let us know which 2 weeks of the year you would like to volunteer and host Him into your homes. May He enrich your lives.</p>
        </div>
        <HomeVisitRequestForm />
      </div>
    </main>
  );
};

export default HomeVisitRequestPage;
