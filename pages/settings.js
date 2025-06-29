import React from 'react';
import Header from '../components/Header';
import CountrySelector from '../components/CountrySelector';
import Footer from '../components/Footer';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6 text-center">Settings</h1>

          <div className="max-w-2xl mx-auto space-y-8">
            {/* Example of a section, you can add more here later */}
            <CountrySelector />

            {/* Add other settings sections here */}
            {/*
            <div className="bg-[#292929] p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-white">Account Preferences</h3>
              <p className="text-gray-300">Manage your account details.</p>
            </div>
            */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}