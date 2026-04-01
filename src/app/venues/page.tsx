import { getVenues } from '@/lib/data/db';
import { MapPin, Plus, Edit3, Car, Navigation, AlertTriangle } from 'lucide-react';

export default async function VenuesList() {
  const venues = await getVenues();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">会場マスタ</h1>
        <button className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> 新規登録
        </button>
      </div>

      <div className="space-y-4">
        {venues.map(venue => (
          <div key={venue.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={20} className="text-blue-500" />
                {venue.name}
              </h2>
              <button className="text-slate-400 hover:text-blue-600 p-1">
                <Edit3 size={18} />
              </button>
            </div>

            <div className="space-y-2 mt-4 text-sm">
              {venue.address && (
                <div className="flex items-start gap-2.5 text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <Navigation size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{venue.address}</span>
                </div>
              )}
              {venue.parking_note && (
                <div className="flex items-start gap-2.5 text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <Car size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{venue.parking_note}</span>
                </div>
              )}
              {venue.handoff_note && (
                <div className="flex items-start gap-2.5 text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <AlertTriangle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">受け渡しメモ</span>
                    {venue.handoff_note}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
