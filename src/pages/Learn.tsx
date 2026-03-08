import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search, BookOpen, Palette, Calculator, Globe, FlaskConical,
  Music, Dumbbell, Monitor, Languages, MapPin,
} from "lucide-react";
import { useState } from "react";

const SUBJECTS = [
  { name: "Mathématiques", icon: Calculator, color: "bg-green-100 text-green-600", fiches: 0 },
  { name: "Français", icon: BookOpen, color: "bg-blue-100 text-blue-600", fiches: 0 },
  { name: "Histoire-Géo EMC", icon: MapPin, color: "bg-yellow-100 text-yellow-600", fiches: 0 },
  { name: "Sciences (SVT)", icon: FlaskConical, color: "bg-emerald-100 text-emerald-600", fiches: 0 },
  { name: "Physique-Chimie", icon: FlaskConical, color: "bg-orange-100 text-orange-600", fiches: 0 },
  { name: "Anglais", icon: Languages, color: "bg-purple-100 text-purple-600", fiches: 0 },
  { name: "Espagnol", icon: Globe, color: "bg-red-100 text-red-600", fiches: 0 },
  { name: "Art Plastiques", icon: Palette, color: "bg-pink-100 text-pink-600", fiches: 0 },
  { name: "Musique", icon: Music, color: "bg-fuchsia-100 text-fuchsia-600", fiches: 0 },
  { name: "EPS", icon: Dumbbell, color: "bg-teal-100 text-teal-600", fiches: 0 },
  { name: "Technologie", icon: Monitor, color: "bg-sky-100 text-sky-600", fiches: 0 },
];

const Learn = () => {
  const [search, setSearch] = useState("");

  const filtered = SUBJECTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          Apprendre
        </h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Recherche complète dans toutes les fiches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Matières
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((subject) => (
              <Card
                key={subject.name}
                className="glass-card hover:shadow-md transition-all cursor-pointer group"
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${subject.color}`}
                  >
                    <subject.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {subject.fiches} fiches
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Learn;
