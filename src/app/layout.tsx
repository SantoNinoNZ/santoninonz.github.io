import { Roboto, Lora } from "next/font/google";
import VideoBackground from "./VideoBackground";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import UpdateNotifier from "@/components/UpdateNotifier";
import "./globals.css";
import { metadata } from "./metadata";

export { metadata };

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

const lora = Lora({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${lora.variable}`}>
        <ServiceWorkerRegister />
        <UpdateNotifier />
        <VideoBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
          <footer className="bg-[#861D1D] text-[#E8E2D1] p-6 text-center shadow-md mt-auto">
            <p className="text-lg">&copy; {new Date().getFullYear()} Santo Niño NZ. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
