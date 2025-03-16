import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
    Button,
    DialogActionTrigger,
    DialogTitle,
    Input,
    Text,
    VStack,
  } from "@chakra-ui/react"

import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { type ItemCategoryCreate, ItemCategoryService } from "../../client"
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


  const AddCategory = () => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast } = useCustomToast()
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isValid, isSubmitting },
    } = useForm<ItemCategoryCreate>({
      mode: "onBlur",
      criteriaMode: "all",
      defaultValues: {
        item_category_name: "",
        item_category_code: "",
        item_category_isactive: true
      },
    })
  
    const mutation = useMutation({
      mutationFn: (data: ItemCategoryCreate) =>
        ItemCategoryService.createItemCategory({ requestBody: data }),
      onSuccess: () => {
        showSuccessToast("Item created successfully.")
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
  
    const onSubmit: SubmitHandler<ItemCategoryCreate> = (data) => {
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
          <Button value="add-item" my={4}>
            <FaPlus fontSize="16px" />
            Add Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>Fill in the details to add a new Category.</Text>
              <VStack gap={4}>
                <Field
                  required
                  invalid={!!errors.item_category_name}
                  errorText={errors.item_category_name?.message}
                  label="Category"
                >
                  <Input
                    id="title"
                    {...register("item_category_name", {
                      required: "Category name is required.",
                    })}
                    placeholder="Category Name"
                    type="text"
                  />
                </Field>
  
                <Field
                  invalid={!!errors.item_category_code}
                  errorText={errors.item_category_code?.message}
                  label="Category code"
                >
                  <Input
                    id="description"
                    {...register("item_category_code")}
                    placeholder="Category Code"
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
  
  export default AddCategory
  