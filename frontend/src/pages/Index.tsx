
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">SK</span>
          </div>
          <span className="font-semibold text-lg">Skillarix</span>
        </div>
        <Button asChild>
          <Link to="/dashboard">Get Started</Link>
        </Button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-20">
          <section className="text-center space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-2">
              Sales Training & Evaluation System
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Train your sales team for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                perfect pitches
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Prepare your sales team with AI-powered practice sessions before they meet real customers at product expos and demonstrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Start Training <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl gradient-card space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary text-xl font-semibold">1</span>
              </div>
              <h3 className="text-xl font-semibold">Setup</h3>
              <p className="text-muted-foreground">
                Upload your product documents and let our system learn all the technical details.
              </p>
            </div>

            <div className="p-6 rounded-xl gradient-card space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary text-xl font-semibold">2</span>
              </div>
              <h3 className="text-xl font-semibold">Practice</h3>
              <p className="text-muted-foreground">
                Engage with AI-generated customer questions and provide your best sales responses.
              </p>
            </div>

            <div className="p-6 rounded-xl gradient-card space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary text-xl font-semibold">3</span>
              </div>
              <h3 className="text-xl font-semibold">Evaluate</h3>
              <p className="text-muted-foreground">
                Get detailed feedback on your performance with actionable insights to improve.
              </p>
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold">Why Sales Teams Love Us</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our system bridges the gap between training and real-world sales situations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Realistic Practice",
                  description: "Train with AI-generated questions that mimic real customer interactions"
                },
                {
                  title: "Instant Feedback",
                  description: "Get immediate evaluation on your sales pitch effectiveness"
                },
                {
                  title: "Product Knowledge",
                  description: "Ensure accurate technical information presentation"
                },
                {
                  title: "Progress Tracking",
                  description: "Monitor improvement over multiple practice sessions"
                }
              ].map((feature, i) => (
                <div key={i} className="p-5 border rounded-lg space-y-2">
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t py-8 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-xs">SK</span>
              </div>
              <span className="font-medium">Skillarix</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Skillarix. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
