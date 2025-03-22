import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import {
  Button,
  Input,
  Text,
  VStack,
  MenuItem,
  NativeSelect,
} from "@chakra-ui/react"
import {
  DialogActionTrigger,
  DialogTitle,
} from "../ui/dialog"

import { useState } from "react"
import { FaExchangeAlt } from "react-icons/fa"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { type ItemSubCategoryPublic } from "../../client"
import { type ItemSubCategoryUpdate } from "../../client"
import { ItemSubCategoryService } from "../../client"
import { ItemCategoryService } from "../../client"
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

interface EditSubCategoryProps {
  item: ItemSubCategoryPublic
}

const EditSubCategory = ({ item }: EditSubCategoryProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ItemSubCategoryUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      item_subcategory_name: item.item_subcategory_name,
      item_subcategory_code: item.item_subcategory_code,
      item_category_id: item.item_category_id,
      item_subcategory_isactive: item.item_subcategory_isactive,
    },
  })

  // Fetch categories for dropdown
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ItemCategoryService.readItemCategories(),
  })
  
  // Extract categories array from response 
  const categories = categoriesResponse?.data || []

  const mutation = useMutation({
    mutationFn: (data: ItemSubCategoryUpdate) =>
      ItemSubCategoryService.updateItemSubcategory({
        id: item.item_subcategory_id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Subcategory updated successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] })
    },
  })

  const onSubmit: SubmitHandler<ItemSubCategoryUpdate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        setIsOpen(open);
        if (open) {
          reset({
            item_subcategory_name: item.item_subcategory_name,
            item_subcategory_code: item.item_subcategory_code,
            item_category_id: item.item_category_id,
            item_subcategory_isactive: item.item_subcategory_isactive,
          });
        }
      }}
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
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the subcategory details.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.item_category_id}
                errorText={errors.item_category_id?.message}
                label="Parent Category"
              >
                <NativeSelect.Root key="plain" variant="plain">
                  <NativeSelect.Field
                    placeholder="Select Category"
                    {...register("item_category_id", {
                      required: "Parent category is required.",
                    })}
                  >
                    {Array.isArray(categories) &&
                      categories.map((category) => (
                        <option
                          key={category.item_category_id}
                          value={category.item_category_id}
                        >
                          {category.item_category_name}
                        </option>
                      ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>

              <Field
                required
                invalid={!!errors.item_subcategory_name}
                errorText={errors.item_subcategory_name?.message}
                label="Subcategory Name"
              >
                <Input
                  id="name"
                  {...register("item_subcategory_name", {
                    required: "Subcategory name is required.",
                  })}
                  placeholder="Subcategory Name"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.item_subcategory_code}
                errorText={errors.item_subcategory_code?.message}
                label="Subcategory Code"
              >
                <Input
                  id="code"
                  {...register("item_subcategory_code")}
                  placeholder="Subcategory Code"
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
  );
}

export default EditSubCategory