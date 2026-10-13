'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/shared/components/ui/menubar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/shared/components/ui/navigation-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

import { SampleCard } from '../Sample'

export function NavigationCard() {
  return (
    <SampleCard
      title="Navigation"
      description="Breadcrumb, menubar, navigation menu, tabs."
      className="flex flex-col gap-4"
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Requirement specification</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">3 Functional</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>REQ-001</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Run</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Stop
              <MenubarShortcut>Esc</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>Retry from a step</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Run settings</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Artifact</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Export</MenubarItem>
            <MenubarItem>Compare versions</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Toggle side panel
              <MenubarShortcut>Ctrl B</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Artifacts</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-56 gap-1 p-1">
                <li>
                  <NavigationMenuLink href="#">Requirements analysis</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#">Requirement specification</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#">Product backlog</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Traceability</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Tabs defaultValue="trace">
        <TabsList>
          <TabsTrigger value="trace">Trace</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="trace" className="text-xs">
          derived_from AR-003, depends_on REQ-002
        </TabsContent>
        <TabsContent value="timeline" className="text-xs">
          v3 edited by you, v2 approved, v1 created by requirement_engineer
        </TabsContent>
      </Tabs>
    </SampleCard>
  )
}
