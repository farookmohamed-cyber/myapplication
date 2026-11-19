package com.laboratory.model;

import com.laboratory.processing.TestProcessingReport;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.util.List;

@Entity
@DiscriminatorValue("MICROBIOLOGY_TEST")
public class MicrobiologyTest extends LaboratoryTest {

    public MicrobiologyTest() {
        super();
    }

    @Override
    public TestCategory resolveCategory() {
        return TestCategory.MICROBIOLOGY_TEST;
    }

    @Override
    public TestProcessingReport processTest(Sample sample) {
        List<String> steps = List.of(
                "1. Perform aseptic biosafety cabinet inoculation of specimen " + sample.getSampleCode() + " onto selective media",
                "2. Incubate culture plates at 37°C under controlled aerobic/CO2 atmosphere",
                "3. Execute Gram stain microscopy and colony morphology screening",
                "4. Conduct antimicrobial susceptibility profiling and record reference threshold (" + getNormalRange() + ")"
        );
        return buildReport(
                sample,
                TestCategory.MICROBIOLOGY_TEST,
                steps,
                "MicrobiologyTest processor completed culture incubation & Gram stain profiling via " + getProcessingProcedure()
        );
    }
}
