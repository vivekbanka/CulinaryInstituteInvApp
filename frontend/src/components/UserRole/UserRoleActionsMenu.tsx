import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { UserRolePublic } from "../../client"
import DeleteUserRole from "./DeleteUserRole"
import EditUserRole from "./EditUserRole"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

interface UserRoleActionsMenuProps {
  userRole: UserRolePublic
}

export const UserRoleActionsMenu = ({ userRole }: UserRoleActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditUserRole item={userRole} />
        <DeleteUserRole 
          id={userRole?.user_role_id} 
        />
      </MenuContent>
    </MenuRoot>
  )
}