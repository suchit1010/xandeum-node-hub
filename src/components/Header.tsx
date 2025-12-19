import { useState, useEffect } from "react";
import { Search, RefreshCw, Bell, Settings, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import xandeumLogo from "@/assets/xandeum-logo.png";

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export function Header({ onRefresh, isLoading }: HeaderProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={xandeumLogo} alt="Xandeum" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold gradient-text">pNode Analytics</h1>
              <p className="text-xs text-muted-foreground">Real-time Validator Dashboard</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pNodes by ID or address..."
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground mr-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
              <span>Live</span>
              <span className="text-border">•</span>
              <span>Updated {lastUpdate.toLocaleTimeString()}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="hover:bg-secondary"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            
            <Button variant="ghost" size="icon" className="hover:bg-secondary">
              <Bell className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="hover:bg-secondary">
              <Settings className="h-4 w-4" />
            </Button>

            <Button 
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => window.open("https://www.xandeum.network/docs?_gl=1*1g85y28*_gcl_au*MTI4NDY0NTA3OC4xNzY1MzQ4NzEy", "_blank")}
            >
              <span>Docs</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
