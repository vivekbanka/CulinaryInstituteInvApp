import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Text,
} from "@chakra-ui/react"
import { FiTrash2 } from "react-icons/fi"
import { useState } from "react"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { UserRoleService } from "../../client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"


interface DeleteUserRoleProps {
  id: string
}

const DeleteUserRole = ({ id }: DeleteUserRoleProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => UserRoleService.deleteUserRole({ id: id }),
    onSuccess: () => {
      showSuccessToast("User role assignment removed successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userroles"] })
    },
  })

  const handleDelete = () => {
    mutation.mutate()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "sm" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" colorPalette="red">
          <FiTrash2 fontSize="16px" />
          Remove Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Role Assignment</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to remove this role 
          </Text>
        </DialogBody>

        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button
              variant="subtle"
              colorPalette="gray"
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="red"
            onClick={handleDelete}
            loading={mutation.isPending}
          >
            Remove
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteUserRole