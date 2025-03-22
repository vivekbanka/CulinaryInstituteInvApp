import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { ItemSubCategoryPublic } from "../../client"
import DeleteSubCategory from "./DeleteSubCategory"
import EditSubCategory from "./EditSubCategory"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

interface SubCategoryActionsMenuProps {
  item: ItemSubCategoryPublic
}

export const SubCategoryActionsMenu = ({ item }: SubCategoryActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditSubCategory item={item} />
        <DeleteSubCategory id={item.item_subcategory_id} />
      </MenuContent>
    </MenuRoot>
  )
}