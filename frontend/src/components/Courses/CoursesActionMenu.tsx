import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import type { CoursesPublic } from "../../client"
import DeleteItem from "./DeleteCourses"
import EditItem from "./EditCourse"

interface ItemActionsMenuProps {
  item: CoursesPublic
}

export const CategoryActionsMenu = ({ item }: ItemActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditItem item={item} />
        <DeleteItem id={item.course_id} />
      </MenuContent>
    </MenuRoot>
  )
}
