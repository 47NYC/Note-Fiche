import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageCircle, Megaphone, ClipboardList } from "lucide-react";

const CLASS_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-indigo-500 to-blue-500",
];

interface ClassCardProps {
  className: string;
  memberCount: number;
  colorIndex?: number;
  onClick?: () => void;
}

export function ClassCard({ className, memberCount, colorIndex = 0, onClick }: ClassCardProps) {
  const gradient = CLASS_COLORS[colorIndex % CLASS_COLORS.length];

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
      onClick={onClick}
    >
      <div className={`h-24 bg-gradient-to-r ${gradient} relative`}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
        <div className="absolute bottom-3 left-4">
          <h3 className="text-white font-heading font-bold text-lg drop-shadow-md">{className}</h3>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {memberCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" /> Chat
          </span>
          <span className="flex items-center gap-1">
            <Megaphone className="w-4 h-4" /> Annonces
          </span>
          <span className="flex items-center gap-1">
            <ClipboardList className="w-4 h-4" /> Devoirs
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
