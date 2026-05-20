/**
 * @file skeleton.tsx
 * @description Skeleton 컴포넌트입니다.
 * 로딩 상태를 표시하기 위한 스켈레톤 UI입니다.
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
