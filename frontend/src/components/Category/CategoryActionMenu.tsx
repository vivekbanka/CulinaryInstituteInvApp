import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import type { ItemCategoryPublic } from "../../client"
import DeleteItem from "./DeleteItem"
import EditItem from "./EditItem"

interface ItemActionsMenuProps {
  item: ItemCategoryPublic
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
        <DeleteItem id={item.item_category_id} />
      </MenuContent>
    </MenuRoot>
  )
}
