import {
    Button,
    ButtonGroup,
    DialogActionTrigger,
    Input,
    Text,
    VStack,
  } from "@chakra-ui/react"
  import { useMutation, useQueryClient } from "@tanstack/react-query"
  import { useState } from "react"
  import { type SubmitHandler, useForm } from "react-hook-form"
  import { FaExchangeAlt } from "react-icons/fa"
  
  import { type ApiError, type  ItemCategoryPublic, ItemCategoryService, ItemCategoryUpdate } from "../../client"
  import useCustomToast from  "../../hooks/useCustomToast"
  import { handleError } from "../../utils"
  import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
  } from "../ui/dialog"
  import { Field } from "../ui/field"

  
  interface EditItemProps {
    item: ItemCategoryPublic
  }
  
  interface CategoryUpdateForm {
    item_category_code: string
    item_category_name?: string
  }
  
  const EditItem = ({ item }: EditItemProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast } = useCustomToast()
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
    } = useForm<CategoryUpdateForm>({
      mode: "onBlur",
      criteriaMode: "all",
      defaultValues: {
        ...item,
        item_category_name: item.item_category_name ?? undefined,
        
      },
    })
  
    const mutation = useMutation({
      mutationFn: (data:  ItemCategoryUpdate) =>
        ItemCategoryService.updateItemCatergory({ id: item.item_category_id, requestBody: data }),
      onSuccess: () => {
        showSuccessToast("Item updated successfully.")
        reset()
        setIsOpen(false)
      },
      onError: (err: ApiError) => {
        handleError(err)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] })
      },
    })
  
    const onSubmit: SubmitHandler<CategoryUpdateForm> = async (data) => {
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
          <Button variant="ghost">
            <FaExchangeAlt fontSize="16px" />
            Edit Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit category </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>Update the Category details below.</Text>
              <VStack gap={4}>
                <Field
                  required
                  invalid={!!errors.item_category_name}
                  errorText={errors.item_category_name?.message}
                  label="Category Name"
                >
                  <Input
                    id="CategoryName"
                    {...register("item_category_name", {
                      required: "Title is required",
                    })}
                    placeholder="Title"
                    type="text"
                  />
                </Field>
  
                <Field
                  invalid={!!errors.item_category_code}
                  errorText={errors.item_category_code?.message}
                  label="Description"
                >
                  <Input
                    id="CategoryCode"
                    {...register("item_category_code")}
                    placeholder="category code"
                    type="text"
                  />
                </Field>
              </VStack>
            </DialogBody>
  
            <DialogFooter gap={2}>
              <ButtonGroup>
                <DialogActionTrigger asChild>
                  <Button
                    variant="subtle"
                    colorPalette="gray"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogActionTrigger>
                <Button variant="solid" type="submit" loading={isSubmitting}>
                  Save
                </Button>
              </ButtonGroup>
            </DialogFooter>
          </form>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    )
  }
  
  export default EditItem
  