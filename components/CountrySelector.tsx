// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Country } from '../types';

export default function CountrySelector(): React.ReactElement {
  const { data: session, update: updateSession } = useSession();
  const { addToast } = useToast();

  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState<boolean>(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch list of countries from TMDB API
  useEffect(() => {
    async function fetchCountries(): Promise<void> {
      setIsLoadingCountries(true);
      try {
        const res = await fetch('/api/tmdb-countries');
        if (!res.ok) throw new Error('Failed to fetch countries');
        const data: Country[] = await res.json();
        // Sort countries alphabetically by name for better UX
        data.sort((a, b) => a.english_name.localeCompare(b.english_name));
        setCountries(data);
      } catch (error) {
        console.error('Error fetching countries:', error);
        addToast({
          title: 'Error',
          description: 'Failed to load country list.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingCountries(false);
      }
    }
    fetchCountries();
  }, [addToast]);

  // Update selected country when session loads or changes
  useEffect(() => {
    if (session?.user?.country) {
      setSelectedCountry(session.user.country);
    } else if (session?.user) {
      // If session is loaded but country is null, default to AU
      setSelectedCountry('AU');
    }
  }, [session?.user?.country, session?.user]);

  const handleSaveCountry = async (): Promise<void> => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/update-country', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedCountry }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update country.');
      }

      // Update the session on the client side to reflect the change immediately
      await updateSession({ country: selectedCountry });

      addToast({
        title: 'Success',
        description: `Your preferred country has been updated to ${
          countries.find((c) => c.iso_3166_1 === selectedCountry)?.english_name || selectedCountry
        }.`,
        variant: 'success'
      });
    } catch (error) {
      console.error('Error saving country:', error);
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save country.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#292929] p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 text-white">Where to Watch Country</h3>
      <p className="text-gray-300 mb-4">
        Select your preferred country for streaming availability. This will affect the "Where to Watch" information displayed for movies and TV shows.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Select
          value={selectedCountry}
          onValueChange={setSelectedCountry}
          disabled={isLoadingCountries || isSaving}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700 max-h-60 overflow-y-auto">
            {isLoadingCountries ? (
              <SelectItem value="loading" disabled>Loading countries...</SelectItem>
            ) : (
              countries.map((country) => (
                <SelectItem key={country.iso_3166_1} value={country.iso_3166_1}>
                  {country.english_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={handleSaveCountry}
          disabled={isSaving || isLoadingCountries || !selectedCountry || selectedCountry === session?.user?.country}
          className="bg-[#E50914] hover:bg-red-700 text-white w-full sm:w-auto"
        >
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : 'Save Country'}
        </Button>
      </div>
    </div>
  );
}
