package com.laboratory.model;

import com.laboratory.processing.TestProcessingReport;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.util.List;

@Entity
@DiscriminatorValue("HEMATOLOGY_TEST")
public class HematologyTest extends LaboratoryTest {

    public HematologyTest() {
        super();
    }

    @Override
    public TestCategory resolveCategory() {
        return TestCategory.HEMATOLOGY_TEST;
    }

    @Override
    public TestProcessingReport processTest(Sample sample) {
        List<String> steps = List.of(
                "1. Confirm EDTA anticoagulation and absence of micro-clots in " + sample.getSampleCode(),
                "2. Aspirate specimen through automated 5-part laser flow-cytometry & impedance analyzer",
                "3. Prepare peripheral blood smear and stain with Wright-Giemsa",
                "4. Verify cellular indices and histogram flags against " + getNormalRange() + " " + getUnit()
        );
        return buildReport(
                sample,
                TestCategory.HEMATOLOGY_TEST,
                steps,
                "HematologyTest processor completed automated cell count & differential review via " + getProcessingProcedure()
        );
    }
}
