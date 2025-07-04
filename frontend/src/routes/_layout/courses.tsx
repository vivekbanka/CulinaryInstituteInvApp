import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { CourseService } from "@/client"
//  import { LocationActionsMenu } from "@/components/Location/LocationActionMenu"
import PendingItems from "@/components/Pending/PendingItems"
import AddLocation from "@/components/Location/AddLocation"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const itemsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      CourseService.readCourses({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["courses", { page }],
  }
}

export const Route = createFileRoute("/_layout/courses")({
  component: Items,
  validateSearch: (search) => itemsSearchSchema.parse(search),
})

function CoursesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getItemsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const courses = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingItems />
  }

  if (courses.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any courses yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new courses to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="30%">ID</Table.ColumnHeader>
            <Table.ColumnHeader w="30%">Course Name</Table.ColumnHeader>
            <Table.ColumnHeader w="30%">Course Description</Table.ColumnHeader>
            <Table.ColumnHeader w="30%">Course IsActive</Table.ColumnHeader>
            <Table.ColumnHeader w="10%">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {courses?.map((Course) => (
            <Table.Row key={Course.course_id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="30%">
                {Course.course_id}
              </Table.Cell>
              <Table.Cell truncate maxW="30%">
                {Course.course_name}
              </Table.Cell>
              <Table.Cell truncate maxW="30%">
                {Course.course_description}
              </Table.Cell>
               <Table.Cell truncate maxW="30%">
                {Course.is_active? "Active":"InActive"}
              </Table.Cell>
              <Table.Cell width="10%">
                 {/* <LocationActionsMenu location={location} /> */}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Items() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Courses
      </Heading>
      <CoursesTable></CoursesTable>

    </Container>
  )
}
