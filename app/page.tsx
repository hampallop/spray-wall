'use client'

import React from 'react'
import { CirclePlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ClimbingWall } from '@/components/climbing-wall'

export default function Home() {
  const [isAddingHold, setIsAddingHold] = React.useState(false)
  return (
    <div className="">
      <nav className="flex justify-between items-center py-4 px-4">
        <div className="w-12"></div>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-medium tracking-tight">
            Eagle Eye’s Spray Wall
          </h1>
        </div>
        <div className="w-12 justify-end flex">
          <Button
            variant="ghost"
            className={cn('p-2 border', !isAddingHold && 'border-transparent')}
            onClick={() => setIsAddingHold(!isAddingHold)}
          >
            <CirclePlusIcon
              fill={isAddingHold ? 'black' : 'white'}
              color={isAddingHold ? 'white' : 'black'}
            />
          </Button>
        </div>
      </nav>
      <ClimbingWall
        isAddingHold={isAddingHold}
        setIsAddingHold={setIsAddingHold}
      />
    </div>
  )
}
