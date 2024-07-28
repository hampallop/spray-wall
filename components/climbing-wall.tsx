'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResetConfirmDialog } from '@/components/reset-confirm-dialog'

const holdStates = ['start', 'next', 'finish'] as const
type HoldState = (typeof holdStates)[number]

interface Hold {
  id: string
  x: number
  y: number
  state: HoldState
}

export const ClimbingWall: React.FC<{
  isAddingHold: boolean
  setIsAddingHold: (isAddingHold: boolean) => void
}> = ({ isAddingHold, setIsAddingHold }) => {
  const [holds, setHolds] = useState<Hold[]>([])
  const [selectedHold, setSelectedHold] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageDimensions, setImageDimensions] = useState({
    width: 1235,
    height: 1674,
  })
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const updateImageDimensions = () => {
      if (imageRef.current) {
        setImageDimensions({
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
        })
      }
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768) // Adjust this breakpoint as needed
    }

    const handleResize = () => {
      updateImageDimensions()
      checkMobile()
    }

    window.addEventListener('resize', handleResize)

    if (imageRef.current && imageRef.current.complete) {
      updateImageDimensions()
    } else if (imageRef.current) {
      imageRef.current.onload = updateImageDimensions
    }

    checkMobile()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const holdsParam = searchParams.get('holds')
    if (holdsParam) {
      try {
        const decodedHolds = JSON.parse(decodeURIComponent(holdsParam))
        setHolds(decodedHolds)
      } catch (error) {
        console.error('Error parsing holds from URL:', error)
      }
    }
  }, [searchParams])

  const updateURL = (newHolds: Hold[]) => {
    const encodedHolds = encodeURIComponent(JSON.stringify(newHolds))
    router.push(`?holds=${encodedHolds}`, { scroll: false })
  }

  const addHold = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingHold || !containerRef.current || !imageRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    const newHold: Hold = {
      id: Date.now().toString(),
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      state: 'start',
    }

    const newHolds = [...holds, newHold]
    setHolds(newHolds)
    updateURL(newHolds)
  }

  const updateHoldPosition = (id: string, newX: number, newY: number) => {
    const newHolds = holds.map((hold) =>
      hold.id === id ? { ...hold, x: newX, y: newY } : hold,
    )
    setHolds(newHolds)
    updateURL(newHolds)
  }

  const toggleHoldState = (id: string) => {
    const newHolds = holds.reduce((acc, hold) => {
      if (hold.id === id) {
        const currentIndex = holdStates.indexOf(hold.state)
        const nextIndex = (currentIndex + 1) % (holdStates.length + 1)
        if (nextIndex < holdStates.length) {
          acc.push({ ...hold, state: holdStates[nextIndex] })
        }
      } else {
        acc.push(hold)
      }
      return acc
    }, [] as Hold[])
    setHolds(newHolds)
    updateURL(newHolds)
    setSelectedHold(null)
  }

  const resetProblem = () => {
    setHolds([])
    setSelectedHold(null)
    setIsAddingHold(false)
    updateURL([])
  }

  const handleDragStart = (event: React.MouseEvent, holdId: string) => {
    event.stopPropagation()
    setSelectedHold(holdId)
  }

  const handleDrag = (event: React.MouseEvent) => {
    if (!selectedHold || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    updateHoldPosition(
      selectedHold,
      Math.round(x * 100) / 100,
      Math.round(y * 100) / 100,
    )
  }

  const handleDragEnd = () => {
    setSelectedHold(null)
  }

  const saveImage = () => {
    if (containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg')!
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      canvas.width = imageDimensions.width
      canvas.height = imageDimensions.height
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height)
        const svgImg = new Image()
        svgImg.onload = () => {
          ctx.drawImage(
            svgImg,
            0,
            0,
            imageDimensions.width,
            imageDimensions.height,
          )
          const link = document.createElement('a')
          link.download = 'climbing-problem.png'
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
        svgImg.src =
          'data:image/svg+xml;base64,' +
          btoa(unescape(encodeURIComponent(svgData)))
      }
      img.src = imageRef.current!.src
    }
  }

  const copyLink = () => {
    const url = window.location.href

    if (navigator.clipboard && window.isSecureContext) {
      // Use the Clipboard API if available
      navigator.clipboard
        .writeText(url)
        .then(() => {
          alert('Link copied to clipboard!')
        })
        .catch((err) => {
          console.error('Failed to copy link: ', err)
          fallbackCopyTextToClipboard(url)
        })
    } else {
      // Fallback for browsers that don't support the Clipboard API
      fallbackCopyTextToClipboard(url)
    }
  }
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text

    // Make the textarea out of viewport
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      const msg = successful ? 'successful' : 'unsuccessful'
      console.log('Fallback: Copying text command was ' + msg)
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err)
      alert('Failed to copy link. Please copy it manually: ' + text)
    }

    document.body.removeChild(textArea)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedHold(null)
        setIsAddingHold(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getHoldSize = () => {
    const baseSize =
      Math.min(imageDimensions.width, imageDimensions.height) * 0.02
    return isMobile ? baseSize * 1.5 : baseSize
  }

  const handleHoldInteraction = (
    e: React.MouseEvent | React.TouchEvent,
    holdId: string,
  ) => {
    e.preventDefault()
    const isTouch = 'touches' in e
    if (isTouch) {
      const touch = (e as React.TouchEvent).touches[0]
      handleDragStart(
        {
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as React.MouseEvent,
        holdId,
      )
    } else {
      ;(e as React.MouseEvent).stopPropagation()
      toggleHoldState(holdId)
    }
  }

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div
        ref={containerRef}
        className="relative cursor-crosshair w-full mx-auto select-none"
        style={{
          maxWidth: '100vw',
          aspectRatio: '1235 / 1674',
        }}
        onClick={addHold}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={(e) => {
          if (selectedHold) {
            e.preventDefault()
            const touch = e.touches[0]
            handleDrag({
              clientX: touch.clientX,
              clientY: touch.clientY,
            } as React.MouseEvent)
          }
        }}
        onTouchEnd={handleDragEnd}
      >
        <img
          ref={imageRef}
          src="/wall-image.jpg"
          alt="Climbing Wall"
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
          draggable="false"
        />
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {holds.map((hold) => (
            <g key={hold.id} className="cursor-move pointer-events-auto">
              <circle
                cx={`${hold.x}%`}
                cy={`${hold.y}%`}
                r={getHoldSize()}
                fill={
                  hold.state === 'start'
                    ? '#22c55e'
                    : hold.state === 'next'
                    ? '#3b82f6'
                    : '#ef4444'
                }
                stroke="white"
                strokeWidth="1"
                className={`${
                  selectedHold === hold.id ? 'stroke-yellow-400' : ''
                }`}
                onMouseDown={(e) => handleDragStart(e, hold.id)}
                onTouchStart={(e) => handleHoldInteraction(e, hold.id)}
                onClick={(e) => handleHoldInteraction(e, hold.id)}
              />
              <text
                x={`${hold.x}%`}
                y={`${hold.y}%`}
                dy="0.35em"
                textAnchor="middle"
                fontSize={getHoldSize() * 0.8}
                fill="white"
                pointerEvents="none"
              >
                {hold.state === 'start'
                  ? 'S'
                  : hold.state === 'next'
                  ? 'N'
                  : 'F'}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <ResetConfirmDialog onConfirm={resetProblem}>
          <Button>Reset Problem</Button>
        </ResetConfirmDialog>
        <Button onClick={saveImage}>Save Image</Button>
        <Button onClick={copyLink}>Copy Link</Button>
      </div>
      {selectedHold && (
        <div className="mt-4 space-y-2 text-center">
          <h3 className="text-lg font-semibold">Adjust Hold Position</h3>
          {holds.find((h) => h.id === selectedHold) && (
            <div className="flex justify-center gap-2">
              <Input
                type="number"
                value={holds.find((h) => h.id === selectedHold)!.x}
                onChange={(e) =>
                  updateHoldPosition(
                    selectedHold,
                    Number(e.target.value),
                    holds.find((h) => h.id === selectedHold)!.y,
                  )
                }
                className="w-24"
                min="0"
                max="100"
                step="0.01"
              />
              <Input
                type="number"
                value={holds.find((h) => h.id === selectedHold)!.y}
                onChange={(e) =>
                  updateHoldPosition(
                    selectedHold,
                    holds.find((h) => h.id === selectedHold)!.x,
                    Number(e.target.value),
                  )
                }
                className="w-24"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
