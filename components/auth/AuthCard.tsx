import { Card } from '@/components/ui/Card'

export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card className="mx-auto w-full sm:w-[32rem]">
    <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#1a5c2a]">{title}</h1>
    <p className="mb-6 text-sm leading-relaxed text-gray-600">{description}</p>
    {children}
  </Card>
}
