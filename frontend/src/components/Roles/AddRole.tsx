import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
    Button,
    DialogActionTrigger,
    DialogTitle,
    Input,
    Text,
    Textarea,
    VStack,
  } from "@chakra-ui/react"

import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { type RolesCreate, RoleService } from "../../client"
import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTrigger,
  } from "../ui/dialog"
import { Field } from "../ui/field"


  const AddRole = () => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast } = useCustomToast()
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isValid, isSubmitting },
    } = useForm<RolesCreate>({
      mode: "onBlur",
      criteriaMode: "all",
      defaultValues: {
        role_name: "",
        role_is_active: true
      },
    })
  
    const mutation = useMutation({
      mutationFn: (data: RolesCreate) =>
        RoleService.createRole({ requestBody: data }),
      onSuccess: () => {
        showSuccessToast("Role created successfully.")
        reset()
        setIsOpen(false)
      },
      onError: (err: ApiError) => {
        handleError(err)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["roles"] })
      },
    })
  
    const onSubmit: SubmitHandler<RolesCreate> = (data) => {
      mutation.mutate(data)
    }
  
    return (
      <DialogRoot
        size={{ base: "xs", md: "md" }}
        placement="center"
        open={isOpen}
        onOpenChange={({ open }) => setIsOpen(open)}
      >
        <DialogTrigger asChild>
          <Button value="add-role" my={4}>
            <FaPlus fontSize="16px" />
            Add Role
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>Fill in the details to add a new role.</Text>
              <VStack gap={4}>
                <Field
                  required
                  invalid={!!errors.role_name}
                  errorText={errors.role_name?.message}
                  label="Role Name"
                >
                  <Input
                    id="roleName"
                    {...register("role_name", {
                      required: "Role name is required.",
                    })}
                    placeholder="Role Name"
                    type="text"
                  />
                </Field>
              </VStack>
            </DialogBody>
  
            <DialogFooter gap={2}>
              <DialogActionTrigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="gray"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button
                variant="solid"
                type="submit"
                disabled={!isValid}
                loading={isSubmitting}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    )
  }
  
  export default AddRole