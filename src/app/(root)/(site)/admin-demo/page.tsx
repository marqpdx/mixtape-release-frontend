"use client";

import React, { useState, useEffect } from 'react';
import {
 Box,
 Flex,
 Text,
 IconButton,
 Grid,
 Card,
 Badge,
 Button,
 Accordion,
 useBreakpointValue
} from '@chakra-ui/react';
import {
 IconUsers,
 IconMail,
 IconBook,
 IconSettings,
 IconChartBar, // Changed from IconChart
 IconBell,
 IconNote,
 IconCalendar,
 IconGripVertical,
 IconMaximize,
 IconPin,
 IconX,
 IconMenu2
} from '@tabler/icons-react';
import { useColorModeValue } from '@components/ui/color-mode';

// Tile categories with colors and icons
const ADMIN_SECTIONS = {
 groups: { icon: IconUsers, color: 'blue', label: 'Groups', category: 'community' },
 members: { icon: IconUsers, color: 'green', label: 'Members', category: 'community' },
 mail: { icon: IconMail, color: 'purple', label: 'Mail', category: 'communication' },
 dispatch: { icon: IconBell, color: 'orange', label: 'Dispatch', category: 'communication' },
 almanac: { icon: IconBook, color: 'teal', label: 'Almanac', category: 'content' },
 threadworks: { icon: IconNote, color: 'pink', label: 'Threadworks', category: 'content' },
 analytics: { icon: IconChartBar, color: 'cyan', label: 'Analytics', category: 'system' }, // Fixed icon
 settings: { icon: IconSettings, color: 'gray', label: 'Settings', category: 'system' }
};

// Sample tile data
const INITIAL_TILES: Tile[] = [
 { id: 'groups', section: 'groups', x: 0, y: 0, w: 1, h: 1, pinned: false },
 { id: 'members', section: 'members', x: 1, y: 0, w: 1, h: 1, pinned: false },
 { id: 'analytics', section: 'analytics', x: 2, y: 0, w: 1, h: 1, pinned: false },
 { id: 'mail', section: 'mail', x: 0, y: 1, w: 1, h: 1, pinned: false },
 { id: 'dispatch', section: 'dispatch', x: 1, y: 1, w: 1, h: 1, pinned: false },
 { id: 'almanac', section: 'almanac', x: 2, y: 1, w: 1, h: 1, pinned: false },
 { id: 'notes', section: 'threadworks', x: 0, y: 2, w: 2, h: 1, pinned: false },
 { id: 'settings', section: 'settings', x: 2, y: 2, w: 1, h: 1, pinned: false }
];

const GRID_COLS = 3;
const MIN_TILE_SIZE = { w: 1, h: 1 }; // 1/6 of grid (since we have 3 cols, 1 = 1/3)

type AdminSectionKey = keyof typeof ADMIN_SECTIONS;
type Tile = {
  id: string;
  section: AdminSectionKey;
  x: number;
  y: number;
  w: number;
  h: number;
  pinned: boolean;
};

function AdminTile({
  tile,
  onResize,
  onMove,
  onPin,
  onRemove,
  isActive,
  onClick,
}: {
  tile: Tile;
  onResize: (id: string, newSize: { w: number; h: number }) => void;
  onMove: (id: string, newPos: { x: number; y: number }) => void;
  onPin: (id: string) => void;
  onRemove: (id: string) => void;
  isActive: boolean;
  onClick: (id: string) => void;
}) {
 const [isDragging, setIsDragging] = useState(false);
 const [dragStart, setDragStart] = useState<null | { x: number; y: number }>(null);

 const section = ADMIN_SECTIONS[tile.section];
 const IconComponent = section.icon;

 const bg = useColorModeValue('white', 'gray.800');
 const borderColor = useColorModeValue('gray.200', 'gray.600');
 const activeBg = useColorModeValue('blue.50', 'blue.900');

 // Calculate size based on grid position
 const widthPercent = (tile.w / GRID_COLS) * 100;
 const heightVh = tile.h * 25; // Each unit = 25vh

 const handleMouseDown = (e: React.MouseEvent) => {
   if (e.detail === 2) { // Double click
     // Toggle between normal and hero size
     const newSize = tile.w === 1 && tile.h === 1
       ? { w: 2, h: 2 } // Make hero
       : { w: 1, h: 1 }; // Make normal
     onResize(tile.id, newSize);
   } else {
     setIsDragging(true);
     setDragStart({ x: e.clientX, y: e.clientY });
   }
 };

 return (
   <Card.Root
     position="absolute"
     left={`${(tile.x / GRID_COLS) * 100}%`}
     top={`${tile.y * 25}vh`}
     width={`${widthPercent}%`}
     height={`${heightVh}vh`}
     minW="150px"
     minH="120px"
     bg={isActive ? activeBg : bg}
     borderColor={isActive ? `${section.color}.300` : borderColor}
     borderWidth="2px"
     cursor={isDragging ? 'grabbing' : 'grab'}
     transform={isDragging ? 'scale(1.02)' : 'scale(1)'}
     transition="all 0.2s"
     zIndex={isDragging ? 1000 : isActive ? 10 : 1}
     onClick={() => onClick(tile.id)}
     _hover={{
       transform: 'translateY(-2px)',
       boxShadow: 'lg'
     }}
   >
     {/* Tile Header */}
     <Card.Header
       p={3}
       pb={2}
       onMouseDown={handleMouseDown}
       bg={useColorModeValue(`${section.color}.50`, `${section.color}.900`)}
       borderTopRadius="md"
     >
       <Flex align="center" justify="space-between">
         <Flex align="center" gap={2}>
           <IconComponent size={20} color={`var(--chakra-colors-${section.color}-500)`} />
           <Text fontSize="sm" fontWeight="semibold">
             {section.label}
           </Text>
           <Badge size="sm" colorScheme={section.color}>
             {tile.w}×{tile.h}
           </Badge>
         </Flex>

         <Flex gap={1}>
           {tile.pinned && <IconPin size={14} />}
           <IconButton
             size="xs"
             variant="ghost"
             onClick={(e) => {
               e.stopPropagation();
               onPin(tile.id);
             }}
           >
             <IconPin size={14} />
           </IconButton>
           <IconButton
             size="xs"
             variant="ghost"
             onClick={(e) => {
               e.stopPropagation();
               onResize(tile.id, { w: tile.w === 1 ? 2 : 1, h: tile.h === 1 ? 2 : 1 });
             }}
           >
             <IconMaximize size={14} />
           </IconButton>
         </Flex>
       </Flex>
     </Card.Header>

     {/* Tile Content */}
     <Card.Body p={4}>
       <Text fontSize="xs" color="gray.500" mb={2}>
         {section.category} • Position: {tile.x},{tile.y}
       </Text>

       {/* Sample content based on section */}
       {tile.section === 'groups' && (
         <Box>
           <Text fontSize="2xl" fontWeight="bold" color={`${section.color}.500`}>
             1,247
           </Text>
           <Text fontSize="sm">Active Groups</Text>
         </Box>
       )}

       {tile.section === 'members' && (
         <Box>
           <Text fontSize="2xl" fontWeight="bold" color={`${section.color}.500`}>
             8,932
           </Text>
           <Text fontSize="sm">Community Members</Text>
         </Box>
       )}

       {tile.section === 'analytics' && (
         <Box>
           <Text fontSize="lg" fontWeight="bold" color={`${section.color}.500`}>
             +23%
           </Text>
           <Text fontSize="sm">Growth this month</Text>
         </Box>
       )}

       {tile.section === 'mail' && (
         <Box>
           <Text fontSize="lg" fontWeight="bold" color={`${section.color}.500`}>
             156
           </Text>
           <Text fontSize="sm">Unread messages</Text>
         </Box>
       )}

       {/* Default content for other tiles */}
       {!['groups', 'members', 'analytics', 'mail'].includes(tile.section) && (
         <Box>
           <Text fontSize="sm" color="gray.600">
             {section.label} management panel
           </Text>
           {tile.w > 1 && (
             <Text fontSize="xs" color="gray.400" mt={2}>
               Expanded view with additional controls and data visualization.
             </Text>
           )}
         </Box>
       )}
     </Card.Body>

     {/* Resize Handle */}
     <Box
       position="absolute"
       bottom={0}
       right={0}
       w={4}
       h={4}
       cursor="se-resize"
       bg={`${section.color}.200`}
       borderTopLeftRadius="md"
       opacity={0.7}
       _hover={{ opacity: 1 }}
     >
       <IconGripVertical size={12} style={{ margin: '2px' }} />
     </Box>
   </Card.Root>
 );
}

function SidebarNav({
  sections,
  onSectionClick,
  activeSection,
  sortOrder,
  onSortChange
}: {
  sections: typeof ADMIN_SECTIONS;
  onSectionClick: (sectionKey: AdminSectionKey) => void;
  activeSection: AdminSectionKey;
  sortOrder: string;
  onSortChange: (order: string) => void;
}) {
 const bg = useColorModeValue('gray.50', 'gray.900');
 const isMobile = useBreakpointValue({ base: true, md: false });

 if (isMobile) {
   return (
     <Box w="100%" p={2} bg={bg}>
       <Accordion.Root>
         <Accordion.Item value="admin-sections">
           <Accordion.ItemTrigger>
             <IconMenu2 size={20} />
             <Text ml={2}>Admin Sections</Text>
             <Accordion.ItemIndicator />
           </Accordion.ItemTrigger>
           <Accordion.ItemContent>
             <Accordion.ItemBody>
               <Grid templateColumns="repeat(4, 1fr)" gap={2} p={2}>
                 {Object.entries(sections).map(([key, section]) => {
                   const IconComponent = section.icon;
                   return (
                     <Button
                       key={key}
                       size="sm"
                       variant={activeSection === key ? 'solid' : 'ghost'}
                       onClick={() => onSectionClick(key as AdminSectionKey)}
                       flexDir="column"
                       h="60px"
                     >
                       <IconComponent size={20} />
                       <Text fontSize="xs">{section.label}</Text>
                     </Button>
                   );
                 })}
               </Grid>
             </Accordion.ItemBody>
           </Accordion.ItemContent>
         </Accordion.Item>
       </Accordion.Root>
     </Box>
   );
 }

 return (
   <Box w="7%" minW="80px" bg={bg} p={2} borderRight="1px solid" borderColor="gray.200">
     <Text fontSize="xs" fontWeight="bold" mb={3} textAlign="center">
       Admin
     </Text>

     <Flex direction="column" gap={2}>
       {Object.entries(sections).map(([key, section]) => {
         const IconComponent = section.icon;
         return (
           <IconButton
             key={key}
             size="md"
             variant={activeSection === key ? 'solid' : 'ghost'}
             onClick={() => onSectionClick(key as AdminSectionKey)}
             position="relative"
           >
             <IconComponent size={24} />
             {activeSection === key && (
               <Box
                 position="absolute"
                 left="-2px"
                 top="50%"
                 transform="translateY(-50%)"
                 w="3px"
                 h="80%"
                 bg={`${section.color}.500`}
                 borderRadius="sm"
               />
             )}
           </IconButton>
         );
       })}
     </Flex>
   </Box>
 );
}

export default function MixtapeAdminDashboard() {
 const [tiles, setTiles] = useState(INITIAL_TILES);
 const [activeTile, setActiveTile] = useState<string | null>(null);
 const [activeSection, setActiveSection] = useState<AdminSectionKey>('groups');
 const [sortOrder, setSortOrder] = useState('default');

 const headerBg = useColorModeValue('white', 'gray.800');
 const isMobile = useBreakpointValue({ base: true, md: false });

 const handleTileResize = (tileId: string, newSize: { w: number; h: number }) => {
   setTiles(prev => prev.map(tile =>
     tile.id === tileId
       ? { ...tile, ...newSize }
       : tile
   ));
 };

 const handleTilePin = (tileId: string) => {
   setTiles(prev => prev.map(tile =>
     tile.id === tileId
       ? { ...tile, pinned: !tile.pinned }
       : tile
   ));
 };

 const handleSectionClick = (sectionKey: AdminSectionKey) => {
   setActiveSection(sectionKey);
   // Focus on tiles of this section
   const sectionTile = tiles.find(tile => tile.section === sectionKey);
   if (sectionTile) {
     setActiveTile(sectionTile.id);
   }
 };

 return (
   <Box h="100vh" w="100%" bg={useColorModeValue('gray.100', 'gray.900')}>
     {/* Header - 10vh */}
     <Box
       h="10vh"
       bg={headerBg}
       p={4}
       borderBottom="1px solid"
       borderColor="gray.200"
       boxShadow="sm"
     >
       <Flex align="center" justify="space-between" h="100%">
         <Box>
           <Text fontSize="xl" fontWeight="bold" color="green.500">
             🧬 Mixtape Admin
           </Text>
           <Text fontSize="sm" color="gray.500">
             Welcome back, Community Builder
           </Text>
         </Box>

         <Flex align="center" gap={4}>
           <Badge colorScheme="green" size="lg">
             {tiles.length} Active Tiles
           </Badge>
           <Text fontSize="sm" color="gray.500">
             Grid: {GRID_COLS} columns
           </Text>
         </Flex>
       </Flex>
     </Box>

     <Flex h="90vh" direction={isMobile ? 'column' : 'row'}>
       {/* Sidebar Navigation */}
       <SidebarNav
         sections={ADMIN_SECTIONS}
         onSectionClick={handleSectionClick}
         activeSection={activeSection}
         sortOrder={sortOrder}
         onSortChange={setSortOrder}
       />

       {/* Main Tile Area */}
       <Box
         flex="1"
         position="relative"
         overflow={isMobile ? 'auto' : 'hidden'}
         p={isMobile ? 4 : 2}
       >
         {isMobile ? (
           // Mobile: Stack tiles vertically
           <Flex direction="column" gap={4}>
             {tiles.map((tile) => {
               const section = ADMIN_SECTIONS[tile.section];
               return (
                 <Card.Root key={tile.id} minH="200px">
                   <Card.Header bg={`${section.color}.50`}>
                     <Flex align="center" gap={2}>
                       {React.createElement(section.icon, { size: 20 })}
                       <Text fontWeight="semibold">
                         {section.label}
                       </Text>
                     </Flex>
                   </Card.Header>
                   <Card.Body>
                     <Text fontSize="sm">
                       Mobile view for {section.label}
                     </Text>
                   </Card.Body>
                 </Card.Root>
               );
             })}
           </Flex>
         ) : (
           // Desktop: Mosaic tile system
           <>
             {tiles.map((tile) => (
               <AdminTile
                 key={tile.id}
                 tile={tile}
                 onResize={handleTileResize}
                 onMove={() => {}}
                 onPin={handleTilePin}
                 onRemove={() => {}}
                 isActive={activeTile === tile.id}
                 onClick={setActiveTile}
               />
             ))}
           </>
         )}
       </Box>
     </Flex>
   </Box>
 );
}