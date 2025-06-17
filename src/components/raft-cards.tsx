import React from 'react'

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { AspectRatio } from './ui/aspect-ratio'
import { BookDialog } from './book-dialog'
import Image from 'next/image'

export function RaftCards() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 grid-rows-5 sm:grid-rows-2 gap-2'>
      <Card>
            <CardHeader>
              <CardTitle>Small Raft</CardTitle>
              <CardDescription>A 2-4 Person Raft</CardDescription>
              <CardAction><BookDialog/></CardAction>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 9}>
              <Image
               src="/24.png"
                 width={500}
                 height={0}
                 alt="5-7 person raft"
                 className="rounded-md"
              />
              </AspectRatio>
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
              <CardTitle>Medium Raft</CardTitle>
              <CardDescription>A 5-7 Person Raft</CardDescription>
              <CardAction><BookDialog/></CardAction>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 9}>
              <Image
               src="/57.png"
                 width={500}
                 height={0}
                 alt="5-7 person raft"
                 className="rounded-md"
              />
              </AspectRatio>
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
              <CardTitle>Large Raft</CardTitle>
              <CardDescription>A 6-9 Person Raft</CardDescription>
              <CardAction><BookDialog/></CardAction>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 9}>
              <Image
               src="/57.png"
                 width={500}
                 height={0}
                 alt="5-7 person raft"
                 className="rounded-md"
              />
              </AspectRatio>
            </CardContent>
         </Card>
         <div className="sm:col-span-3 row-span-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:items-start">
          <Card className="w-full sm:w-1/3">
          <CardHeader>
              <CardTitle>Stand up Paddle Board</CardTitle>
              <CardDescription>A 1 Person SUP</CardDescription>
              <CardAction><BookDialog/></CardAction>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 11}>
              <Image
               src="/57.png"
                 width={500}
                 height={0}
                 alt="5-7 person raft"
                 className="rounded-md"
              />
              </AspectRatio>
            </CardContent>
         </Card>
         <Card className="w-full sm:w-1/3">
          <CardHeader>
              <CardTitle>Kanu</CardTitle>
              <CardDescription>A 1-2 Person Kanu</CardDescription>
              <CardAction><BookDialog/></CardAction>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 11}>
              <Image
               src="/12.png"
                 width={500}
                 height={0}
                 alt="5-7 person raft"
                 className="rounded-md"
              />
              </AspectRatio>
            </CardContent>
         </Card>
    </div>
  </div>
  )
}
