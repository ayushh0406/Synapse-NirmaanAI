import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Code, FileCode, History, Zap } from "lucide-react";

export default function Home() {
  const recentProjects = [
    { id: 1, name: 'E-commerce Dashboard', date: '2 days ago', components: 8 },
    { id: 2, name: 'Social Media App', date: '1 week ago', components: 12 },
    { id: 3, name: 'Portfolio Website', date: 'Just now', components: 5 },
  ];

  const stats = [
    { label: 'Projects Created', value: '24', icon: <FileCode className="h-5 w-5" /> },
    { label: 'Components Generated', value: '128', icon: <Code className="h-5 w-5" /> },
    { label: 'Generation History', value: '54', icon: <History className="h-5 w-5" /> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Synapse</h1>
          <p className="text-muted-foreground">Your multimodal UI generator workspace</p>
        </div>
        <Button className="neobrutalist-button">
          <Zap className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="neobrutalist-card">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">{stat.label}</CardTitle>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="neobrutalist-card md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your recently created UI projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-xs text-muted-foreground">{project.date} • {project.components} components</p>
                  </div>
                  <Button variant="ghost" size="sm">Open</Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Projects</Button>
          </CardFooter>
        </Card>

        <Card className="neobrutalist-card md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Generate UI components instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium mb-2">UI Component</h3>
              <p className="text-sm text-muted-foreground mb-3">Generate a single UI component with a text prompt</p>
              <Button className="w-full">Create Component</Button>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium mb-2">Complete Screen</h3>
              <p className="text-sm text-muted-foreground mb-3">Generate a full screen UI with multiple components</p>
              <Button className="w-full">Create Screen</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}