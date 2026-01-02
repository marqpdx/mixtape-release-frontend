// src/components/threadworks/ForumCreate.tsx

"use client"

import { useState } from 'react'
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Textarea,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Card, Field } from '@chakra-ui/react'
import { IconDeviceFloppy, IconUsers, IconWorld, IconLock } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { axiosInstance } from '@mixtape/api/lib/axiosInstance'
import { MixtapeAlert } from '@components/ui/alerts/MixtapeAlert'

interface ForumCreateProps {
  sponsorType: 'group' | string
  sponsorId: string
  sponsorName: string
  onSuccess?: (slug: string) => void
}

export default function ForumCreate({
  sponsorType,
  sponsorId,
  sponsorName,
  onSuccess,
}: ForumCreateProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'group',
  })

  const router = useRouter()

  // All color mode hooks must be called at the top level
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const selectedBgColor = useColorModeValue('green.50', 'green.900')

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Forum title is required'
    if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters long'
    if (formData.description.length > 500) newErrors.description = 'Description must be less than 500 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      const response = await axiosInstance.post('/api/threadworks', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
        sponsor_type: sponsorType,
        sponsor_id: sponsorId,
      })

      const slug = response.data.slug
      if (onSuccess) {
        onSuccess(slug)
      } else {
        router.push(`/threadworks/${slug}`)
      }
    } catch (error) {
      const backendErrors: Record<string, string> = {}
      const errorData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data

      if (errorData) {
        Object.entries(errorData).forEach(([key, value]) => {
          backendErrors[key] = Array.isArray(value) ? value[0] : String(value)
        })
      }
      setErrors(backendErrors)
    } finally {
      setLoading(false)
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <IconWorld size={20} />
      case 'members': return <IconUsers size={20} />
      case 'group': return <IconLock size={20} />
      default: return <IconLock size={20} />
    }
  }

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Anyone can view and participate in this forum'
      case 'members': return 'Only registered members can view and participate'
      case 'group': return `Only members of ${sponsorName} can access this forum`
      default: return ''
    }
  }

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">Create New Forum</Heading>
      </Card.Header>
      <Card.Body>
        <VStack gap={6} align="stretch">
          <Field.Root invalid={!!errors.title}>
            <Field.Label>Forum Title</Field.Label>
            <Input value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} maxLength={200} />
            {errors.title && <Field.ErrorText>{errors.title}</Field.ErrorText>}
            <Field.HelperText>Choose a clear, descriptive name</Field.HelperText>
          </Field.Root>

          <Field.Root invalid={!!errors.description}>
            <Field.Label>Description (Optional)</Field.Label>
            <Textarea rows={4} maxLength={500} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} />
            {errors.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
            <Field.HelperText>{formData.description.length}/500 characters</Field.HelperText>
          </Field.Root>

          <Field.Root invalid={!!errors.visibility}>
            <Field.Label>Forum Visibility</Field.Label>
            <VStack gap={3} align="stretch">
              {(['public', 'members', 'group'] as const).map((option) => (
                <Box
                  key={option}
                  p={4}
                  border="2px solid"
                  borderColor={formData.visibility === option ? 'green.500' : borderColor}
                  borderRadius="lg"
                  cursor="pointer"
                  bg={formData.visibility === option ? selectedBgColor : 'transparent'}
                  onClick={() => handleInputChange('visibility', option)}
                >
                  <HStack gap={3}>
                    <Box color={formData.visibility === option ? 'green.500' : textColor}>
                      {getVisibilityIcon(option)}
                    </Box>
                    <VStack align="start" gap={1} flex={1}>
                      <HStack>
                        <Text fontWeight="semibold" textTransform="capitalize">
                          {option === 'group' ? `${sponsorName} Only` : option}
                        </Text>
                        {formData.visibility === option && <Box w={2} h={2} borderRadius="full" bg="green.500" />}
                      </HStack>
                      <Text fontSize="sm" color={textColor}>{getVisibilityDescription(option)}</Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Field.Root>

          <MixtapeAlert description={`This forum will be sponsored by <strong>${sponsorName}</strong>`} />
        </VStack>
      </Card.Body>
      <Card.Footer>
        <HStack justify="end">
          <Button colorScheme="green" onClick={handleSubmit} disabled={loading || !formData.title.trim()} loading={loading}>
            <IconDeviceFloppy size={18} />
            Create Forum
          </Button>
        </HStack>
      </Card.Footer>
    </Card.Root>
  )
}

// // src/components/threadworks/ForumCreate.tsx

// "use client"

// import { useState } from 'react'
// import {
//   Box,
//   Heading,
//   Text,
//   Button,
//   Input,
//   VStack,
//   HStack,
//   Textarea,
// } from '@chakra-ui/react'
// import { useColorModeValue } from '@components/ui/color-mode'
// import { Card, Field } from '@chakra-ui/react'
// import { IconDeviceFloppy, IconUsers, IconWorld, IconLock } from '@tabler/icons-react'
// import { useRouter } from 'next/navigation'
// import { axiosInstance } from '@mixtape/api/lib/axiosInstance'
// import { MixtapeAlert } from '@components/ui/alerts/MixtapeAlert'

// interface ForumCreateProps {
//   sponsorType: 'group' | string
//   sponsorId: string
//   sponsorName: string
//   onSuccess?: (slug: string) => void
// }

// export default function ForumCreate({
//   sponsorType,
//   sponsorId,
//   sponsorName,
//   onSuccess,
// }: ForumCreateProps) {
//   const [loading, setLoading] = useState(false)
//   const [errors, setErrors] = useState<Record<string, string>>({})
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     visibility: 'group',
//   })

//   const router = useRouter()
//   const bgColor = useColorModeValue('white', 'gray.800')
//   const borderColor = useColorModeValue('gray.200', 'gray.600')
//   const textColor = useColorModeValue('gray.600', 'gray.300')

//   const handleInputChange = (field: keyof typeof formData, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }))
//     if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
//   }

//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {}
//     if (!formData.title.trim()) newErrors.title = 'Forum title is required'
//     if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters long'
//     if (formData.description.length > 500) newErrors.description = 'Description must be less than 500 characters'
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async () => {
//     if (!validateForm()) return
//     setLoading(true)
//     try {
//       const response = await axiosInstance.post('/api/threadworks', {
//         title: formData.title.trim(),
//         description: formData.description.trim(),
//         visibility: formData.visibility,
//         sponsor_type: sponsorType,
//         sponsor_id: sponsorId,
//       })

//       const slug = response.data.slug
//       onSuccess ? onSuccess(slug) : router.push(`/threadworks/${slug}`)
//     } catch (error: any) {
//       const backendErrors: Record<string, string> = {}
//       Object.entries(error?.response?.data || {}).forEach(([key, value]) => {
//         backendErrors[key] = Array.isArray(value) ? value[0] : String(value)
//       })
//       setErrors(backendErrors)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const getVisibilityIcon = (visibility: string) => {
//     switch (visibility) {
//       case 'public': return <IconWorld size={20} />
//       case 'members': return <IconUsers size={20} />
//       case 'group': return <IconLock size={20} />
//       default: return <IconLock size={20} />
//     }
//   }

//   const getVisibilityDescription = (visibility: string) => {
//     switch (visibility) {
//       case 'public': return 'Anyone can view and participate in this forum'
//       case 'members': return 'Only registered members can view and participate'
//       case 'group': return `Only members of ${sponsorName} can access this forum`
//       default: return ''
//     }
//   }

//   return (
//     <Card.Root>
//       <Card.Header>
//         <Heading size="lg">Create New Forum</Heading>
//       </Card.Header>
//       <Card.Body>
//         <VStack gap={6} align="stretch">
//           <Field.Root invalid={!!errors.title}>
//             <Field.Label>Forum Title</Field.Label>
//             <Input value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} maxLength={200} />
//             {errors.title && <Field.ErrorText>{errors.title}</Field.ErrorText>}
//             <Field.HelperText>Choose a clear, descriptive name</Field.HelperText>
//           </Field.Root>

//           <Field.Root invalid={!!errors.description}>
//             <Field.Label>Description (Optional)</Field.Label>
//             <Textarea rows={4} maxLength={500} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} />
//             {errors.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
//             <Field.HelperText>{formData.description.length}/500 characters</Field.HelperText>
//           </Field.Root>

//           <Field.Root invalid={!!errors.visibility}>
//             <Field.Label>Forum Visibility</Field.Label>
//             <VStack gap={3} align="stretch">
//               {(['public', 'members', 'group'] as const).map((option) => (
//                 <Box
//                   key={option}
//                   p={4}
//                   border="2px solid"
//                   borderColor={formData.visibility === option ? 'green.500' : borderColor}
//                   borderRadius="lg"
//                   cursor="pointer"
//                   bg={formData.visibility === option ? useColorModeValue('green.50', 'green.900') : 'transparent'}
//                   onClick={() => handleInputChange('visibility', option)}
//                 >
//                   <HStack gap={3}>
//                     <Box color={formData.visibility === option ? 'green.500' : textColor}>
//                       {getVisibilityIcon(option)}
//                     </Box>
//                     <VStack align="start" gap={1} flex={1}>
//                       <HStack>
//                         <Text fontWeight="semibold" textTransform="capitalize">
//                           {option === 'group' ? `${sponsorName} Only` : option}
//                         </Text>
//                         {formData.visibility === option && <Box w={2} h={2} borderRadius="full" bg="green.500" />}
//                       </HStack>
//                       <Text fontSize="sm" color={textColor}>{getVisibilityDescription(option)}</Text>
//                     </VStack>
//                   </HStack>
//                 </Box>
//               ))}
//             </VStack>
//           </Field.Root>

//           <MixtapeAlert description={`This forum will be sponsored by <strong>${sponsorName}</strong>`} />
//         </VStack>
//       </Card.Body>
//       <Card.Footer>
//         <HStack justify="end">
//           <Button colorScheme="green" onClick={handleSubmit} disabled={loading || !formData.title.trim()} loading={loading}>
//             <IconDeviceFloppy size={18} />
//             Create Forum
//           </Button>
//         </HStack>
//       </Card.Footer>
//     </Card.Root>
//   )
// }
