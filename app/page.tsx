import { ClimbingWall } from '@/components/climbing-wall'

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Climbing Problem Setter</h1>
      <ClimbingWall />
    </div>
  )
}
