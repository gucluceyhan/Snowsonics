import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { Grid, GridItem } from "@/components/ui/grid";
import { Section } from "@/components/ui/section";
import { Spacer } from "@/components/ui/spacer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GridDemo() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <Container>
        <Section size="md">
          <h1 className="text-4xl font-bold">Responsive Layout Grid System</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Consistent spacing and layout examples
          </p>
          
          <Spacer size="lg" />

          {/* Basic Grid Example */}
          <div className="border p-4 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Basic Grid</h2>
            <Grid cols={1} colsMd={2} colsLg={4} gap={4}>
              <GridItem className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded">Item 1</GridItem>
              <GridItem className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded">Item 2</GridItem>
              <GridItem className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded">Item 3</GridItem>
              <GridItem className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded">Item 4</GridItem>
            </Grid>
          </div>

          <Spacer size="lg" />

          {/* Responsive Card Grid */}
          <div className="border p-4 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Responsive Card Grid</h2>
            <Grid cols={1} colsSm={2} colsLg={3} gap={6}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>Card {i}</CardTitle>
                    <CardDescription>Card description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This is some card content that explains the purpose of this card.</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Action</Button>
                  </CardFooter>
                </Card>
              ))}
            </Grid>
          </div>

          <Spacer size="lg" />

          {/* Different Gap Sizes */}
          <div className="border p-4 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Different Gap Sizes</h2>
            <h3 className="text-lg font-medium mb-2">Small Gap (2)</h3>
            <Grid cols={2} colsMd={4} gap={2} className="mb-6">
              <GridItem className="bg-green-100 dark:bg-green-900/30 p-4 rounded">Item 1</GridItem>
              <GridItem className="bg-green-100 dark:bg-green-900/30 p-4 rounded">Item 2</GridItem>
              <GridItem className="bg-green-100 dark:bg-green-900/30 p-4 rounded">Item 3</GridItem>
              <GridItem className="bg-green-100 dark:bg-green-900/30 p-4 rounded">Item 4</GridItem>
            </Grid>

            <h3 className="text-lg font-medium mb-2">Medium Gap (6)</h3>
            <Grid cols={2} colsMd={4} gap={6} className="mb-6">
              <GridItem className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded">Item 1</GridItem>
              <GridItem className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded">Item 2</GridItem>
              <GridItem className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded">Item 3</GridItem>
              <GridItem className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded">Item 4</GridItem>
            </Grid>

            <h3 className="text-lg font-medium mb-2">Large Gap (12)</h3>
            <Grid cols={2} colsMd={4} gap={12}>
              <GridItem className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded">Item 1</GridItem>
              <GridItem className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded">Item 2</GridItem>
              <GridItem className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded">Item 3</GridItem>
              <GridItem className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded">Item 4</GridItem>
            </Grid>
          </div>

          <Spacer size="lg" />

          {/* Different Section Sizes */}
          <div className="border rounded-lg overflow-hidden">
            <Section size="xs" className="bg-red-50 dark:bg-red-900/10">
              <h3 className="text-lg font-medium">Extra Small Section (xs)</h3>
              <p>This section has minimal vertical padding.</p>
            </Section>

            <Section size="sm" className="bg-orange-50 dark:bg-orange-900/10">
              <h3 className="text-lg font-medium">Small Section (sm)</h3>
              <p>This section has small vertical padding.</p>
            </Section>

            <Section size="md" className="bg-blue-50 dark:bg-blue-900/10">
              <h3 className="text-lg font-medium">Medium Section (md)</h3>
              <p>This section has medium vertical padding.</p>
            </Section>

            <Section size="lg" className="bg-green-50 dark:bg-green-900/10">
              <h3 className="text-lg font-medium">Large Section (lg)</h3>
              <p>This section has large vertical padding.</p>
            </Section>

            <Section size="xl" className="bg-purple-50 dark:bg-purple-900/10">
              <h3 className="text-lg font-medium">Extra Large Section (xl)</h3>
              <p>This section has extra large vertical padding.</p>
            </Section>
          </div>

          <Spacer size="lg" />

          {/* Spacer Demo */}
          <div className="border p-4 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Spacer Component</h2>
            
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
              <p>This is some content.</p>
              <Spacer size="xs" />
              <p>XS Spacer above (h-2).</p>
              <Spacer size="sm" />
              <p>SM Spacer above (h-4).</p>
              <Spacer size="md" />
              <p>MD Spacer above (h-6).</p>
              <Spacer size="lg" />
              <p>LG Spacer above (h-8).</p>
              <Spacer size="xl" />
              <p>XL Spacer above (h-12).</p>
            </div>

            <Spacer size="md" />

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded flex items-center">
              <span>Horizontal spacing:</span>
              <Spacer size="sm" axis="horizontal" />
              <span>SM</span>
              <Spacer size="md" axis="horizontal" />
              <span>MD</span>
              <Spacer size="lg" axis="horizontal" />
              <span>LG</span>
            </div>
          </div>
        </Section>
      </Container>
    </div>
  );
}