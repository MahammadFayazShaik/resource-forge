// app/layout.js

export const metadata = {
  title: 'Resource Forge AI',
  description: 'AI-powered resource and data validation tool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#121212] text-white">
        {children}
      </body>
    </html>
  );
}
