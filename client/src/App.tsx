import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import NotFound from "@/pages/not-found";
import Dashboard from "@/components/dashboard/Dashboard";
import ShipmentDetail from "@/components/shipment/ShipmentDetail";
import NotesTable from "@/components/dashboard/NotesTable";
import ContactsTable from "@/components/dashboard/ContactsTable";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/shipment/:id" component={ShipmentDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Router />
          
          <div className="fixed top-20 right-6 flex flex-col gap-2 z-50">
            {/* Global Notes Toggle Button */}
            <Button 
              variant="outline" 
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsNotesOpen(true)}
              title="Open Notes"
              data-testid="button-toggle-notes"
            >
              <BookOpen className="h-6 w-6" />
            </Button>

            {/* Global Contacts Toggle Button */}
            <Button 
              variant="outline" 
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-accent text-white hover:bg-accent/90"
              onClick={() => setIsContactsOpen(true)}
              title="Open Contacts"
              data-testid="button-toggle-contacts"
            >
              <Users className="h-6 w-6" />
            </Button>
          </div>

          <NotesTable open={isNotesOpen} onOpenChange={setIsNotesOpen} />
          <ContactsTable open={isContactsOpen} onOpenChange={setIsContactsOpen} />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
