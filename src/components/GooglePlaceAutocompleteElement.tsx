"use client";

import React, { useEffect, useRef, useState } from 'react';

// Interface for the custom HTML element to help TypeScript
interface PlaceAutocompleteCustomElement extends HTMLElement {
  value?: string; // If the component supports a value property
  // Define other specific properties or methods if the web component has them
}

interface GooglePlaceAutocompleteElementProps {
  id?: string; // For label association
  apiKey: string | undefined;
  onPlaceSelected: (placeData: { formattedAddress?: string; name?: string } | null) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void; // For manual input sync
  value?: string; // Controlled input value from parent
  className?: string;
  placeholder?: string;
  options?: {
    types?: string[]; // e.g., ['address']
    componentRestrictions?: { country: string | string[] }; // e.g., { country: "ch" }
  };
}

// TypeScript declarations for the Google Maps Web Component and its event
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<
        React.HTMLAttributes<PlaceAutocompleteCustomElement>,
        PlaceAutocompleteCustomElement
      > & {
        'country-codes'?: string;
        'place-types'?: string;
      };
    }
  }
  interface HTMLElementEventMap {
    'gmp-placeselect': CustomEvent<{ place: google.maps.places.Place }>;
  }
}

const SCRIPT_ID = 'google-maps-places-script-beta';

const GooglePlaceAutocompleteElement: React.FC<GooglePlaceAutocompleteElementProps> = ({
  id,
  apiKey,
  onPlaceSelected,
  onChange,
  value,
  className,
  placeholder,
  options,
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const autocompleteRef = useRef<PlaceAutocompleteCustomElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the child input

  useEffect(() => {
    if (typeof window === 'undefined' || !apiKey) {
      if (!apiKey) console.error("Google Maps API key is missing for PlaceAutocompleteElement.");
      return;
    }

    // Check if Google Maps Places API (specifically for web components) is already loaded
    if (window.google && window.google.maps && window.google.maps.places && customElements.get('gmp-place-autocomplete')) {
      setScriptLoaded(true);
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      // If script tag exists, wait for it to load
      const checkReady = () => {
        if (window.google && window.google.maps && window.google.maps.places && customElements.get('gmp-place-autocomplete')) {
          setScriptLoaded(true);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    // Use v=beta as recommended for PlaceAutocompleteElement and other newer Place Library features
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta&loading=async`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => console.error("Failed to load Google Maps script for PlaceAutocompleteElement.");
    document.head.appendChild(script);

  }, [apiKey]);

  useEffect(() => {
    if (!scriptLoaded || !autocompleteRef.current) return;

    const autocompleteElement = autocompleteRef.current;

    const handlePlaceSelect = (event: Event) => {
      const customEvent = event as CustomEvent<{ place: google.maps.places.Place }>;
      const place = customEvent.detail?.place;
      if (place) {
        onPlaceSelected({
          formattedAddress: place.formattedAddress,
          name: place.displayName,
        });
      } else {
        onPlaceSelected(null);
      }
    };

    autocompleteElement.addEventListener('gmp-placeselect', handlePlaceSelect);
    return () => autocompleteElement.removeEventListener('gmp-placeselect', handlePlaceSelect);
  }, [scriptLoaded, onPlaceSelected]);

  if (!apiKey) {
    return (
      <input type="text" id={id} className={className} placeholder={placeholder ? `${placeholder} (Maps API key missing)` : "Maps API key missing"} value={value || ''} onChange={onChange} disabled />
    );
  }

  if (!scriptLoaded) {
    return (
      <input type="text" id={id} className={className} placeholder={placeholder || "Loading address input..."} value={value || ''} onChange={onChange} disabled />
    );
  }

  const countryCodes = options?.componentRestrictions?.country
    ? (Array.isArray(options.componentRestrictions.country) ? options.componentRestrictions.country.join(' ') : options.componentRestrictions.country)
    : undefined;
  const placeTypes = options?.types ? options.types.join(' ') : undefined;

  return (
    <gmp-place-autocomplete ref={autocompleteRef} country-codes={countryCodes} place-types={placeTypes}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        className={className}
        placeholder={placeholder}
        value={value || ''} // Ensure value is not undefined for controlled input
        onChange={onChange}
      />
    </gmp-place-autocomplete>
  );
};

export default GooglePlaceAutocompleteElement;