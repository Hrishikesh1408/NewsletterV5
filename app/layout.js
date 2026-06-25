import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import Script from 'next/script';

export const metadata = {
  title: "Newsletter Manager",
  description: "Collaborative platform for engineering and business team newsletters",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Noto+Sans:wght@400;500;700;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-800 font-sans text-neutral-50" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
        <Script src="https://cdn.quilljs.com/1.3.6/quill.min.js" strategy="beforeInteractive" />
        <AuthGuard>
          <Navbar />
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}
