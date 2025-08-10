import { useState } from 'react';

export default function Onboarding({ onSelectProgression }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg text-center">
        <h2 className="text-xl font-bold mb-4">Choose Your Progression Style</h2>
        <p className="mb-4">How would you like to learn kanji?</p>
        <button
          onClick={() => onSelectProgression('jlpt')}
          className="p-2 bg-blue-500 text-white rounded mb-2 w-full"
        >
          JLPT-Based Progression
        </button>
        <button
          onClick={() => onSelectProgression('statistical')}
          className="p-2 bg-green-500 text-white rounded w-full"
        >
          Unstructured (Statistical) Progression
        </button>
      </div>
    </div>
  );
}